# Tenant isolation

How a BizFlow row is kept inside its tenant, what is actually enforced today, and
what is not. Written after the Phase 0 audit of `server/routes/` and
`server/utils/`.

The short version: **isolation is enforced in application code only.** Every table
carries a `business_id`, every JWT carries one, and every query is expected to
filter on it. The database enforces none of it. See
[adr/0001-business-id-is-the-tenant-id.md](adr/0001-business-id-is-the-tenant-id.md)
for why `business_id` is the tenant column rather than `tenant_id`.

## The model

- `businesses.id` is the tenant. `business_id` on every other table is a plain
  `UUID` column referencing it.
- `req.business_id` comes from the verified JWT in `server/middleware/auth.js`.
  It is never read from the request body, query string, or params.
- Foreign keys are single-column references to globally unique UUIDs. A row can
  point at another tenant's row and Postgres will store it without complaint.

That last point is the whole reason this document exists. A tenant column filters
rows you *fetch*; it says nothing about rows you *point at*. A sale in tenant A
holding `customer_id` of a customer in tenant B is a perfectly valid row. Nothing
in the schema objects. It only becomes visible later, when a query joins across
that id and hands back the name and email of somebody else's customer.

## What the audit found

The 35 route modules in `server/routes/` plus the controllers they call were
reviewed for two shapes of defect:

1. **A stored reference that leaks on read** — a foreign key written from
   request-supplied input without proving the referenced row belongs to the
   caller, then resolved by a join with no tenant predicate.
2. **A direct cross-tenant write** — an `UPDATE` or `DELETE` whose `WHERE` clause
   omits `business_id`.

### Fixed: the import path produced a read leak

`POST /api/import/:resource` is the one place a caller supplies many rows at once
with arbitrary columns. Each resource has an allowlist of columns and inserts
`req.business_id` itself, so the row landed in the correct tenant. But foreign
keys were plain entries in that allowlist, so a caller could point a row at
another tenant's record:

```
POST /api/import/invoices
[{ "customer_id": "<customer belonging to tenant B>", "total": 100 }]
```

The invoice was stored under tenant A. Four reads then resolved that reference:

| Route | Join | What it returned |
| --- | --- | --- |
| `GET /api/reports/sales-report` | `sales` → `customers` | tenant B's customer name |
| `GET /api/reports/profit-loss` | `sale_items` → `products` | tenant B's product and cost |
| `GET /api/reports/inventory-report` | `stock_movements` → `products` | tenant B's product and stock |
| `GET /api/notifications/*` | `notifications` → `customers` | customer name **and email**, and the send-reminder path would have emailed that address |
| `GET /api/dashboard` | `sales` → `customers` | tenant B's customer name on recent sales |
| `GET /api/dashboard/top-products` | `sales` → `sale_items` → `products`/`categories` | tenant B's products, categories and revenue |
| `POST /api/ai/insights` | `sale_items` → `products` | tenant B's product catalogue, into a Gemini prompt |

The fix is in two halves, and neither half is sufficient alone:

- `server/routes/importExport.js` declares which columns are foreign keys
  (`fks`) and proves each referenced id belongs to the caller before the insert,
  via `assertOwned`. A bad row is reported as a single failure so one bad
  reference does not discard the rest of the file.
- Every join above now carries the tenant the way the rest of the codebase
  already did. Without this the *existing* poisoned rows stay poison.

Regression tests are in `server/tests/tenant-isolation.test.js`: two tenants, and
every id belonging to B is probed with A's token — for `404` on `GET`/`PUT`/
`DELETE`, for absence from list responses, for refusal of a body-supplied
`business_id`, for the import foreign keys, and for each join above resolving a
deliberately dangling reference. Both halves were confirmed to fail before the
change; a test that cannot fail proves nothing.

### Investigated, not exploitable: team invitations

`server/routes/team.js` looked like a cross-tenant write at first glance. The
update is `WHERE id = $1` with no `business_id`, and the id arrives in the body:

```js
const invite = await query(
  'SELECT * FROM team_invitations WHERE id = $1 AND token = $2 AND status = $3',
  [req.body.inviteId, req.body.token, 'pending']
);
```

The id is not usable as an enumeration oracle: it is looked up **together with**
the `token`, which is `crypto.randomBytes(32).toString('hex')` — 256 bits of
unguessable capability. The `UPDATE` afterwards re-checks the token, and the
accept path derives the user from the invite row rather than the body. Guessing an
id alone matches nothing. No change was made, because hardening correct code
adds churn without reducing risk.

### Latent: `assertOwned` could not accept the module-level helper

Not a live vulnerability — no reachable path hit it — but a trap. `assertOwned`
was written to take a pool client and calls `client.query`. Around ten call sites
pass `query` from `server/config/db.js`, a function, which would have thrown
`client.query is not a function` the first time any of them ran with a reference
to check. Affected: `productController`, `crm`, `quotations`, `support`,
`pipeline`, `timetracking`. The runner now accepts either.

## Standing gaps

Not fixed here. Listed so they are not mistaken for solved.

- **No row-level security.** Isolation is one missing `WHERE` clause away from a
  breach, in every query, forever. The plan is `withTenant`, which opens a
  transaction, runs `set_config('app.current_business_id', ...)`, and lets RLS
  policies on `business_id` become the backstop. Not yet implemented. Until then,
  an ad-hoc query with a missing predicate is a data breach, and nothing will
  stop it.
- **`assertOwned` only covers 22 tables.** Tables such as `stock_movements`,
  `payments`, `shops`, `notifications`, `audit_logs` and `team_invitations` carry
  `business_id` but are not in its allowlist, so `assertOwned` refuses to check
  references to them. It fails closed, which is the right direction, but the list
  needs to grow as those tables gain write paths.
- **No composite foreign keys.** `business_id` plus `id` as a composite key would
  make the database reject a cross-tenant reference outright. That is a migration
  across 67 tables and belongs with the RLS work, not before it.
- **Foreign keys to the wrong tenant are invisible.** There is no constraint, log
  entry, or metric when one occurs. Once RLS exists, the database raising is also
  the signal.

## Rules for new code

1. Filter by `business_id` on every read, including joins to tables you did not
   think of as user data — `products` and `categories` are user data.
2. Never persist a request-supplied id as a foreign key without `assertOwned`.
   If the referenced table is not in `OWNED_TABLES`, add it in the same commit.
3. Do not add `business_id` to a column allowlist. It comes from the JWT.
4. `assertOwned` answers 404 for both "missing" and "belongs to someone else" on
   purpose. Telling a caller that a UUID exists but is not theirs is an
   enumeration oracle across tenants. Keep it that way.
5. A new join between two tenant tables needs the predicate. The regression test
   pattern in `tests/tenant-isolation.test.js` is the cheap way to prove it.