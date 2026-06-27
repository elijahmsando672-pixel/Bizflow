import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
};

const getDbUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  return `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'bizflow'}`;
};

export const createBackup = async (label = 'manual') => {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `bizflow_${label}_${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  try {
    execSync(`pg_dump "${getDbUrl()}" --no-owner --no-acl -f "${filepath}"`, {
      stdio: 'pipe',
      timeout: 120000,
    });
    const stats = fs.statSync(filepath);
    console.log(`Backup created: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
    return { success: true, filename, size: stats.size, path: filepath };
  } catch (err) {
    console.error('Backup failed:', err.message);
    return { success: false, error: err.message };
  }
};

const ROTATION = {
  daily: 7,
  weekly: 4,
  monthly: 3,
  manual: 10,
};

const cleanupOldBackups = () => {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('bizflow_') && f.endsWith('.sql'));
  for (const [label, keep] of Object.entries(ROTATION)) {
    const matching = files.filter(f => f.includes(`_${label}_`)).sort().reverse();
    for (const old of matching.slice(keep)) {
      fs.unlinkSync(path.join(BACKUP_DIR, old));
      console.log(`  Removed old backup: ${old}`);
    }
  }
};

cleanupOldBackups();
