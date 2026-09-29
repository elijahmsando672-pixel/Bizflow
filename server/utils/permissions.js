import { query } from '../config/db.js';
import { DEFAULT_ROLE_PERMISSIONS } from '../config/roles.js';

/**
 * Renders the default matrix as a `VALUES` list.
 *
 * The flags come from config/roles.js rather than from a request, so inlining
 * them as literals is safe — no user input reaches this string, and it keeps the
 * insert down to a single bound parameter.
 */
const defaultsSql = () => {
  const rows = Object.entries(DEFAULT_ROLE_PERMISSIONS).flatMap(([role, grants]) =>
    Object.entries(grants).map(([resource, flags]) =>
      `('${role}', '${resource}', ${flags.can_create}, ${flags.can_read}, ${flags.can_update}, ${flags.can_delete})`,
    ),
  );
  return `(
    SELECT role_name, resource, can_create, can_read, can_update, can_delete
    FROM (VALUES
      ${rows.join(',\n      ')}
    ) AS defaults(role_name, resource, can_create, can_read, can_update, can_delete)
  )`;
};

/**
 * Gives a business a permission row for every role and resource that does not
 * have one yet.
 *
 * This runs at registration, because `requirePermission` denies rather than
 * allows when a row is missing — a role with no row cannot reach anything, so
 * the rows have to exist before the first non-owner is invited. Existing rows are
 * left alone, which both preserves an admin's tuning and makes the call safe to
 * repeat.
 */
export const ensureDefaultPermissions = async (businessId) => {
  await query(
    `INSERT INTO permissions (business_id, role_name, resource, can_create, can_read, can_update, can_delete)
     SELECT $1, role_name, resource, can_create, can_read, can_update, can_delete
     FROM ${defaultsSql()}
     ON CONFLICT (business_id, role_name, resource) DO NOTHING`,
    [businessId],
  );
};
