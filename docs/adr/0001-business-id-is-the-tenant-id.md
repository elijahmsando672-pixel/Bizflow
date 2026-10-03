# 1. business_id is the tenant identifier

Date: 2026-10-03

## Status

Accepted

## Context

BizFlow was built as a CRM with a sales module bolted on. As it becomes a
point-of-sale system for Kenyan dukas, the number of places a request can cross
from one customer's data to another's rises sharply: offline clients queuing
writes, batch imports, scheduled reports, and eventually row-level security
policies. Each of those needs a single, unambiguous answer to "which tenant does
this row belong to".

The schema already answers it, and answers it 67 times: nearly every table has a
`business_id UUID REFERENCES businesses(id)` column. That column is the tenant
identifier. It has been in production, is populated by existing code, and is the
value carried in every JWT.

Introducing a second identity — a `tenant_id`, or a `tenant` table that
`businesses` points at — would mean two columns that must always agree, on every
table, forever. Every query would need a filter on both or an explicit choice
about which to trust. Every future migration would have to keep them in step. The
benefit would be a more accurate noun.

## Decision

`business_id` is the tenant identifier. There is no `tenant_id` column and no
`tenant` table.

`business_id` is the foreign key used for isolation, in application queries and
in future row-level security policies. "Tenant" is the domain word used in
conversation, documentation, and code comments; `business_id` is the column.

## Consequences

- Existing queries filtering on `business_id` are correct as written. The
  alternative would have made all of them wrong on the day the column was added.
- RLS policies will read `current_setting('app.current_business_id')` and compare
  it against the row's `business_id`. No second column, no join to resolve
  identity.
- Reporting and BI queries group by `business_id` directly.
- New tables carry `business_id UUID NOT NULL REFERENCES businesses(id)` — not
  a nullable column for rows that have no tenant yet. A tenant-less row is a bug,
  not a state to model.
- Code comments should say "tenant" when discussing the concept and `business_id`
  when discussing the column. Mixing the two within one sentence is how
  `tenant_id` looked like a harmless alias.
- `businesses` remains a real table with real columns, because a business has a
  name, a tax configuration, and settings. It is the tenant; it is not merely a
  tenant.

### On branches

A duka may have one location today and several later. `sales` has no branch or
shop column, and the existing `shops` table is not referenced by any sales path —
it is standalone and, as far as the import path and reports are concerned,
inert. The plan is a `branch_id` on the sales tables, not a second tenant
identity: branches sit *below* the tenant and do not change what `business_id`
means. This is deliberately out of scope here; see the POS schema work.

## Alternatives considered

**Add `tenant_id` and keep `business_id`.** Rejected. Two columns that must
agree on 67 tables, with no mechanism to make them disagree loudly. Every future
reviewer would have to check both.

**Rename `business_id` to `tenant_id`.** Rejected for now. It would touch every
query in the codebase and every column index for a naming improvement, and the
cost is repeated at each migration rather than paid once. The cost is ongoing
documentation discipline, which is cheaper and reversible. If the CRM and
point-of-sale sides ever need to converge on one product name, rename then, when
there is a migration to write anyway.

**A `tenants` table with `businesses` as a profile.** Rejected as a speculative
layer for a two-sided product. There is one tenant per business today by
definition, and no requirement has been stated that would make that false.