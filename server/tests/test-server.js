import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase, buildPoolConfig } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { authenticateApiKey } from '../middleware/apiKey.js';

export const app = express();
app.use(cors());
app.use(express.json());

import authRoutes from '../routes/auth.js';
import customerRoutes from '../routes/customers.js';
import productRoutes from '../routes/products.js';
import invoiceRoutes from '../routes/invoices.js';
import saleRoutes from '../routes/sales.js';
import expenseRoutes from '../routes/expenses.js';
import dashboardRoutes from '../routes/dashboard.js';
import reportRoutes from '../routes/reports.js';
import notificationRoutes from '../routes/notifications.js';
import importExportRoutes from '../routes/importExport.js';
import procurementRoutes from '../routes/procurement.js';
import apiKeyRoutes from '../routes/apiKeys.js';
import teamRoutes, { teamPublicRoutes } from '../routes/team.js';
import usersRoutes from '../routes/users.js';
import pushRoutes from '../routes/push.js';

const authenticateApiKeyOrJwt = (req, res, next) => {
  authenticateApiKey(req, res, () => {
    if (req.business_id) return next();
    return authenticate(req, res, next);
  });
};

app.use('/api/auth', authRoutes);
app.use('/api/customers', authenticate, customerRoutes);
app.use('/api/products', authenticate, productRoutes);
app.use('/api/invoices', authenticate, invoiceRoutes);
app.use('/api/sales', authenticate, saleRoutes);
app.use('/api/expenses', authenticate, expenseRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/import', authenticate, importExportRoutes);
app.use('/api/export', authenticate, importExportRoutes);
app.use('/api/procurement', authenticateApiKeyOrJwt, procurementRoutes);
app.use('/api/api-keys', authenticateApiKeyOrJwt, apiKeyRoutes);
// Mirrors app.js ordering: the invitee-side accept route is public, everything
// else on /api/team requires a session.
app.use('/api/team', teamPublicRoutes);
app.use('/api/team', authenticate, teamRoutes);
app.use('/api/users', authenticate, usersRoutes);
// Mirrors app.js: /api/push sits behind `protect` only, with no requirePermission.
app.use('/api/push', authenticate, pushRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

/**
 * Refuses to run against anything that is not recognisably a test database.
 *
 * These suites create rows and delete them again in `afterAll`. `server/.env` is
 * gitignored and therefore present on nearly every developer machine, so a stray
 * DATABASE_URL there is enough to aim all of that at real data. config/db.js
 * already prefers the discrete DB_* vars under NODE_ENV=test; this is the second
 * lock on the same door, for the case where those are wrong too.
 *
 * Override with DB_ALLOW_NON_TEST_DATABASE=true when a test genuinely needs an
 * unusual name — never to point the suite at production.
 */
function assertTestDatabase() {
  if (process.env.DB_ALLOW_NON_TEST_DATABASE === 'true') return;

  const { database } = buildPoolConfig();
  const name = database || '';
  if (!/test/i.test(name)) {
    throw new Error(
      `Refusing to run the test suite against database "${name}". ` +
      'Set DB_NAME to a database whose name contains "test", or set ' +
      'DB_ALLOW_NON_TEST_DATABASE=true if this is deliberate.'
    );
  }
}

export const setupDB = async () => {
  assertTestDatabase();
  return initDatabase(3, 500);
};
