/**
 * One-shot schema + migration runner.
 *
 * Serverless platforms should not run DDL on every cold start, so this is the
 * supported way to prepare a managed database (Supabase, RDS, Cloud SQL, ...):
 *
 *   node scripts/init-db.js
 *
 * It uses DB_INIT_URL when set, otherwise DATABASE_URL. It refuses to run through
 * the Supabase transaction pooler because advisory locks and DDL need a real session.
 */
import dotenv from 'dotenv';
import { initDatabase, shutdown } from '../config/db.js';

dotenv.config();

try {
  await initDatabase(3, 2000);
  console.log('Schema and migrations are up to date');
  process.exitCode = 0;
} catch (error) {
  console.error('Schema initialization failed:', error.message);
  process.exitCode = 1;
} finally {
  await shutdown();
}
