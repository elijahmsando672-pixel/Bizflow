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

### Fixed: push endpoints were a cross-tenant handle

Found by `scripts/audit-tenancy.js` rather than by reading routes. A push endpoint
is a long opaque URL the browser's push service hands out, and `push_subscriptions`
carried a **global** `UNIQUE` on it. Uniqueness scoped the table to the platform
where the rest of the schema scopes to the tenant, and two routes took advantage of
that:

| Route | Before | Consequence |
| --- | --- | --- |
| `POST /api/push/unsubscribe` | `DELETE ... WHERE endpoint = $1` | any authenticated member who knew another tenant's endpoint removed that tenant's subscription, silently stopping its notifications |
| `POST /api/push/subscribe` | `ON CONFLICT (endpoint) DO UPDATE SET p256dh_key, auth_key` | registering an endpoint another tenant already held overwrote the victim's key material while leaving its `business_id` in place, so its pushes then failed at the push service |

Fixed in two halves:

- `server/migrations/009_push_subscriptions_per_business.sql` drops the global
  constraint and makes uniqueness the pair `(business_id, endpoint)`, the same shape
  as `002_unique_per_business.sql`. `server/config/db.js` carries the index too, so
  a fresh database never has the global constraint at all.
- `removeSubscription` now **requires** a scope — `{ userId, businessId }` — and
  throws without one rather than falling back to a delete by endpoint alone. A
  required argument is the point: an optional filter invites the unscoped call
  back. The 410-pruning path inside `sendNotification` is handed the same scope the
  send was made under.

The response reports `removed` but returns `200` for a miss as well as a hit: the
caller's intent holds either way, and distinguishing them would turn the endpoint
into a probe for whether another tenant holds one.

Regression tests in `server/tests/push-tenancy.test.js`. Confirmed to fail against
the pre-fix delete (3 of the behavioural tests) and to assert the index shape
directly, since the behavioural half would still pass on a database where the
migration had not been applied.

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

## The check that keeps this true

`scripts/audit-tenancy.js` (`npm run audit:tenancy`) makes the convention
enforceable instead of reviewable. It reads the tenant-scoped table list out of the
schema, finds every SQL literal handed to `query(`, and requires each statement that
touches one of those tables to carry a `business_id` comparison.

```bash
npm run audit:tenancy          # report, non-zero exit on any violation
npm run audit:tenancy -- --explain   # with the offending statement quoted
```

Three shapes pass without a comparison, because requiring one would be wrong:

- an `INSERT` that **names** `business_id` in its column list — the row is placed
  in a tenant rather than selected from one;
- a `WHERE` assembled in JS (`WHERE ${conditions.join(' AND ')}`), which the audit
  cannot judge and leaves to review;
- an `UPDATE` that sets `business_id`, which is a tenant move, not a tenant-blind
  write.

Everything else needs the comparison. A statement may opt out with an inline
`/* tenant-exempt: <reason> */` above it, and a whole file may declare one for named
tables only:

```js
/* tenant-exempt-file: users — pre-authentication, identity is the scope */
```

Naming the tables keeps the door shut on the rest of the file: a new `customers`
query beside an exempted `users` statement still has to carry its own predicate.
There are currently 25 exemptions, all in pre-authentication or platform-aggregate
code; `--json` lists them with their reasons.

This runs in CI as the `tenancy-audit` job and as part of `npm run lint`.

## Standing gaps

Not fixed here. Listed so they are not mistaken for solved.

- **No row-level security.** Isolation is one missing `WHERE` clause away from a
  breach, in every query, forever. The audit above catches the omission in
  application code; it cannot catch the query written outside the directories it
  scans, and it cannot catch a statement that carries a `business_id` predicate
  that is wrong — aliased to the wrong table in a join, or built from a variable
  that is not `req.business_id`.

  The groundwork is now in place: `server/utils/withTenant.js` opens a
  transaction, pins the tenant with `set_config('app.current_business_id', ...)`,
  and `describeRlsCoverage` reports whether the connected role could bypass
  policies entirely. **No policies are written and no table has RLS enabled**, so
  nothing reads that setting yet. The helper exists so enabling RLS later is a
  migration rather than a refactor of every route.
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
6. Route handlers that need several statements should use `withTenant` rather
   than hand-rolling `pool.connect()` / `BEGIN` / `COMMIT`. It is the same thing,
   with the tenant pinned and the rollback handled in one place.
7. Give a uniqueness constraint to a tenant's **pair**, never a globally unique
   column that any tenant can supply. `endpoint`, `invoice_number` and
   `ticket_number` all identify rows within a business; making any of them globally
   unique hands one tenant a handle on another's row. See
   `002_unique_per_business.sql` and
   `009_push_subscriptions_per_business.sql`.
8. A helper that deletes or mutates by a request-supplied value takes its scope as
   a **required** argument and throws without it.
9. Run `npm run audit:tenancy` before opening a PR. A new statement without a
   `business_id` predicate fails the build, which is cheaper than finding it later.