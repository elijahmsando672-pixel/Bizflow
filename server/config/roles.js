/**
 * Single source of truth for the role vocabulary and the default permission
 * matrix. Routes, middleware and the permission seeder all read from here so a
 * role can never be invitable but unseedable (or seeded but uninhabitable).
 *
 * Roles are hierarchical: `staff` and `accountant` sit at the same level because
 * neither carries team-management rights of its own — they differ in which
 * business data they may touch, not in how much of the team they may control.
 *
 * The invariant every caller relies on is: nobody may grant, modify or remove a
 * role at or above their own. That is what stops a `manager` from minting an
 * `admin` to log in as.
 */
export const ROLE_RANK = { staff: 1, accountant: 1, manager: 2, admin: 3, owner: 4 };

/** Every role a user can hold, most to least privileged. */
export const ROLES = ['owner', 'admin', 'manager', 'staff', 'accountant'];

/**
 * Roles that may be handed to a new account. `owner` is absent on purpose: the
 * team invite flow is the one place a business may add a co-owner, and it
 * checks the rank explicitly rather than listing roles.
 */
export const ASSIGNABLE_ROLES = ['admin', 'manager', 'staff', 'accountant'];

/**
 * Roles that skip the permissions table and are allowed through on rank alone.
 * Kept as an explicit list rather than derived from `ROLE_RANK` so that adding a
 * new senior role later cannot silently hand it a bypass by comparison.
 */
export const PRIVILEGED_ROLES = ['owner', 'admin'];

/** True when a role bypasses the permissions table instead of consulting it. */
export const isPrivileged = (role) => PRIVILEGED_ROLES.includes(role);

/** Resources that may be granted to a non-privileged role. */
export const RESOURCES = [
  'customers', 'products', 'sales', 'expenses', 'invoices', 'leads', 'deals',
  'tickets', 'projects', 'vendors', 'purchase_orders', 'employees', 'team',
  'users', 'reports', 'notifications', 'debtors', 'creditors', 'timetracking',
  'shops', 'reviews', 'messages', 'payments', 'webhooks', 'api_keys',
];

/**
 * Resources only an owner or admin may ever reach, whatever the permissions
 * table says. They are deliberately absent from RESOURCES so the permissions
 * screen never offers them, but that absence must not be the only thing standing
 * between a manager and a self-promotion: `permissions` is a real table an admin
 * can write to, so middleware/rbac.js rejects these by name.
 */
export const ADMIN_ONLY_RESOURCES = ['admin', 'permissions'];

/**
 * Mints credentials and calls outbound URLs, so it stays with owners and admins
 * (who bypass the table entirely) no matter which role a business is seeded with.
 */
const SENSITIVE = ['webhooks', 'api_keys'];

/** Day-to-day operational records a manager runs the business from. */
const OPERATIONAL = [
  'customers', 'products', 'sales', 'expenses', 'invoices', 'leads', 'deals',
  'tickets', 'projects', 'vendors', 'purchase_orders', 'reports',
  'notifications', 'debtors', 'creditors', 'timetracking', 'shops', 'reviews',
  'messages', 'payments',
];

/** Money-facing records an accountant needs to write to, not just read. */
const FINANCE = [
  'customers', 'products', 'sales', 'expenses', 'invoices', 'debtors',
  'creditors', 'payments', 'timetracking', 'reports',
];

/** Records a staff member raises day to day. */
const FRONTLINE = [
  'customers', 'products', 'sales', 'expenses', 'invoices', 'leads', 'tickets',
  'projects', 'debtors', 'creditors', 'timetracking', 'messages', 'payments',
];

const LEVELS = {
  full: { can_create: true, can_read: true, can_update: true, can_delete: true },
  edit: { can_create: true, can_read: true, can_update: true, can_delete: false },
  create: { can_create: true, can_read: true, can_update: false, can_delete: false },
  read: { can_create: false, can_read: true, can_update: false, can_delete: false },
  none: { can_create: false, can_read: false, can_update: false, can_delete: false },
};

/** Expands `resources` at a named access level into a permission row. */
const at = (resources, level) =>
  Object.fromEntries(resources.map((resource) => [resource, LEVELS[level]]));

/**
 * Builds one role's full matrix. Everything starts read-only, the role's own
 * groups are layered on top, and the resources it must never touch are forced
 * shut. Denials win so a group can never accidentally re-open one.
 */
const build = (elevated, denied) => ({
  ...at(RESOURCES, 'read'),
  ...elevated,
  ...at(denied, 'none'),
});

/**
 * Default grants per role, used to seed a business. Owners and admins bypass
 * the table in middleware/rbac.js; their rows exist so the permissions screen
 * shows a complete matrix rather than a column of blanks.
 *
 * The seeder never overwrites an existing row, so an admin who has tuned a role
 * keeps their tuning.
 */
export const DEFAULT_ROLE_PERMISSIONS = {
  owner: at(RESOURCES, 'full'),
  admin: at(RESOURCES, 'full'),
  manager: build(at(OPERATIONAL, 'edit'), ['users', ...SENSITIVE]),
  staff: build(at(FRONTLINE, 'create'), ['users', ...SENSITIVE]),
  accountant: build(at(FINANCE, 'edit'), ['users', ...SENSITIVE]),
};

/** Rank of a role. Unknown roles rank below every real one, so they grant nothing. */
export const rankOf = (role) => ROLE_RANK[role] ?? 0;

/** True when `actorRole` is senior enough to act on a target holding `targetRole`. */
export const outranks = (actorRole, targetRole) => rankOf(actorRole) >= rankOf(targetRole);
