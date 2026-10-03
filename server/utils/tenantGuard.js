import { AppError } from './AppError.js';

// Every table carries a business_id and the session's tenant id is on req.business_id.
// Postgres enforces none of that: the foreign keys are single-column references to a
// globally unique UUID, so a row can point at another tenant's record and the database
// will store it happily. Isolation is therefore only as good as the code below.
//
// The failure mode this module exists to prevent is a request-supplied id being
// persisted as a foreign key without first proving the row is the caller's. Two
// variants showed up in the codebase: a stored dangling FK that later becomes a read
// leak the moment a query joins on it, and a direct cross-tenant write against the
// referenced table (stock decrements being the worst case).

// Fixed list rather than caller-supplied, so a table name can never come from a request.
const OWNED_TABLES = new Set([
  'customers',
  'products',
  'categories',
  'sale_items',
  'sales',
  'invoices',
  'invoice_items',
  'employees',
  'projects',
  'project_tasks',
  'deal_stages',
  'deals',
  'support_tickets',
  'vendors',
  'purchase_orders',
  'expense_categories',
  'debtors',
  'creditors',
  'leads',
  'users',
  'time_entries',
]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value) => typeof value === 'string' && UUID.test(value);

/**
 * Throws unless `id` is a row in `table` owned by `businessId`.
 *
 * The message deliberately does not distinguish "missing" from "belongs to someone
 * else" — telling a caller that a UUID exists but is not theirs is an enumeration
 * oracle across tenants.
 */
export const assertOwned = async (client, table, id, businessId, label = table) => {
  if (!id) return;

  if (!OWNED_TABLES.has(table)) {
    throw new Error(`assertOwned called with an unknown table: ${table}`);
  }
  if (!isUuid(id)) {
    throw new AppError(`Invalid ${label} reference`, 400);
  }

  const { rows } = await client.query(
    `SELECT 1 FROM ${table} WHERE id = $1 AND business_id = $2`,
    [id, businessId]
  );

  if (!rows.length) {
    throw new AppError(`${label} not found`, 404);
  }
};

/**
 * Verifies every id in a request-supplied list. Used where a body carries several
 * foreign keys, such as the line items of a sale.
 */
export const assertAllOwned = async (client, table, ids, businessId, label = table) => {
  for (const id of ids) {
    await assertOwned(client, table, id, businessId, label);
  }
};

/**
 * Collects the ids a set of records points at, skipping blanks and duplicates, so a
 * caller does not need to repeat the validation loop per record.
 */
export const collectIds = (records, field) => {
  const ids = new Set();
  for (const record of records || []) {
    const value = record?.[field];
    if (value) ids.add(value);
  }
  return [...ids];
};