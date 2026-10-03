import { pool, query } from '../config/db.js';
import { AppError } from './AppError.js';

/**
 * Runs `fn` inside a transaction with the tenant pinned for the whole session.
 *
 * Today a query reaches its tenant by remembering `AND business_id = $2`. That is
 * a convention, and a convention fails the one time somebody forgets. `withTenant`
 * makes the tenant part of the connection instead, so the database can enforce it:
 *
 *   set_config('app.current_business_id', <id>, true)
 *
 * The `true` is what makes this work. It scopes the setting to the transaction
 * rather than the session, so the value cannot leak into the next borrower of this
 * connection from the pool, and it cannot outlive a COMMIT or ROLLBACK. Passing
 * `false` here — the default people reach for — leaves the tenant of the previous
 * request attached to a pooled connection, which is a cross-tenant read waiting
 * for whoever runs next. Do not change it.
 *
 * A `business_id` on a request is never trusted for this. Callers pass the id
 * explicitly so the value has a visible origin at the call site; it should be
 * `req.business_id`, which the auth middleware derived from the verified token.
 *
 * RLS policies are not written yet, so nothing currently reads this setting. The
 * helper exists now so the policies can be enabled later as a backstop without a
 * refactor, and so there is one place that knows the transaction-local rule.
 * `server/tests/tenant-isolation.test.js` asserts the setting does not survive
 * the transaction, because that is the failure mode that matters.
 */
export const withTenant = async (businessId, fn, { readOnly = false } = {}) => {
  if (!businessId) {
    throw new AppError('A tenant is required', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Read-only transactions take a share lock rather than a write lock on every
    // table touched, which matters once reports run against a growing sales table.
    if (readOnly) {
      await client.query('SET TRANSACTION READ ONLY');
    }

    await client.query("SELECT set_config('app.current_business_id', $1, true)", [businessId]);

    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Reports whether the connected role can read every tenant's data regardless of
 * RLS. Intended to run at startup once policies are enabled.
 *
 * This is the quiet way RLS stops working: a policy is written, `ALTER TABLE ...
 * ENABLE ROW LEVEL SECURITY` is applied, the tests pass, and nothing changes —
 * because the application connects as the table owner, and owners bypass their
 * own policies by default. `FORCE ROW LEVEL SECURITY` fixes the owner case, but
 * nothing fixes `BYPASSRLS` or superuser, and neither fails loudly either.
 *
 * Returns a report rather than throwing, so it can be logged without taking the
 * process down on a database an operator is still configuring.
 */
export const describeRlsCoverage = async (client) => {
  // Called with no argument at startup, so `query` is the only thing available
  // there; called with a client from inside a transaction. `query` is itself a
  // function, so the function branch has to come first.
  const run = client
    ? (typeof client === 'function' ? client : client.query.bind(client))
    : query;
  const { rows } = await run(
    `SELECT current_user AS role_name,
            r.rolsuper AS is_superuser,
            r.rolbypassrls AS bypasses_rls
       FROM pg_roles r
      WHERE r.rolname = current_user`
  );

  const role = rows[0] || {};
  const { rows: owned } = await run(
    `SELECT count(*)::int AS n
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity`
  );
  const { rows: forced } = await run(
    `SELECT count(*)::int AS n
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relforcerowsecurity`
  );
  const { rows: tenantTables } = await run(
    `SELECT count(*)::int AS n
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'business_id'
      WHERE n.nspname = 'public' AND c.relkind = 'r'`
  );

  return {
    role: role.role_name || null,
    isSuperuser: Boolean(role.is_superuser),
    bypassesRls: Boolean(role.bypasses_rls),
    tablesWithRls: owned[0]?.n ?? 0,
    tablesForcingRls: forced[0]?.n ?? 0,
    tenantTables: tenantTables[0]?.n ?? 0,
    // The two conditions that make every policy a no-op. Either is fatal.
    rlsIsInert:
      Boolean(role.is_superuser) || Boolean(role.bypasses_rls) || (owned[0]?.n ?? 0) === 0,
  };
};