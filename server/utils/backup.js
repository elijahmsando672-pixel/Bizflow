import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LABELS = ['manual', 'daily', 'weekly', 'monthly'];
const ROTATION = {
  daily: 7,
  weekly: 4,
  monthly: 3,
  manual: 10,
};
const DEFAULT_TIMEOUT_MS = 900000;

const getBackupDir = () =>
  path.resolve(process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups'));

const getTimeout = () => {
  const configured = Number(process.env.BACKUP_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;
};

// Credentials are passed through the environment so they never appear in argv or a shell
const buildPgEnv = () => {
  const env = { ...process.env, PGCONNECT_TIMEOUT: process.env.PGCONNECT_TIMEOUT || '10' };

  if (process.env.DATABASE_URL) {
    env.PGDATABASE = process.env.DATABASE_URL;
  } else {
    env.PGHOST = process.env.DB_HOST || 'localhost';
    env.PGPORT = String(process.env.DB_PORT || 5432);
    env.PGDATABASE = process.env.DB_NAME || 'bizflow';
    env.PGUSER = process.env.DB_USER || 'postgres';
    if (process.env.DB_PASSWORD) env.PGPASSWORD = process.env.DB_PASSWORD;
  }

  if (env.DB_SSL === 'true') {
    env.PGSSLMODE = env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? 'require' : 'verify-full';
    if (process.env.DB_SSL_CA) env.PGSSLROOTCERT = process.env.DB_SSL_CA;
  }

  return env;
};

const cleanupOldBackups = (backupDir) => {
  const files = fs.readdirSync(backupDir).filter((f) => f.startsWith('bizflow_') && f.endsWith('.sql'));
  for (const [label, keep] of Object.entries(ROTATION)) {
    const matching = files.filter((f) => f.includes(`_${label}_`)).sort().reverse();
    for (const old of matching.slice(keep)) {
      fs.unlinkSync(path.join(backupDir, old));
      console.log(`  Removed old backup: ${old}`);
    }
  }
};

export const createBackup = async (label = 'manual') => {
  if (!LABELS.includes(label)) {
    const error = `Unsupported backup label: ${label}`;
    console.error('Backup failed:', error);
    return { success: false, error };
  }

  const backupDir = getBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `bizflow_${label}_${timestamp}.sql`;
  const filepath = path.join(backupDir, filename);
  const partialPath = path.join(backupDir, `${filename}.partial`);
  const timeout = getTimeout();

  try {
    fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });

    await execFileAsync(
      'pg_dump',
      ['--format=plain', '--no-owner', '--no-acl', '--no-password', '--file', partialPath],
      { env: buildPgEnv(), timeout, maxBuffer: 1024 * 1024 }
    );

    if (!fs.existsSync(partialPath)) {
      throw new Error('pg_dump did not produce an output file');
    }

    fs.chmodSync(partialPath, 0o600);
    fs.renameSync(partialPath, filepath);

    const stats = fs.statSync(filepath);
    cleanupOldBackups(backupDir);

    console.log(`Backup created: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
    return { success: true, filename, size: stats.size, path: filepath };
  } catch (err) {
    fs.rmSync(partialPath, { force: true });

    let message = err.message;
    if (err.killed) message = `pg_dump timed out after ${timeout}ms`;
    else if (err.stderr && err.stderr.trim()) message = err.stderr.trim();

    console.error('Backup failed:', message);
    return { success: false, error: message };
  }
};
