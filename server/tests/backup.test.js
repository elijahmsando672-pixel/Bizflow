import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

const execFileMock = vi.hoisted(() => vi.fn());

vi.mock('child_process', () => ({ execFile: execFileMock }));

const { createBackup } = await import('../utils/backup.js');

const ENV_KEYS = [
  'DATABASE_URL',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'DB_SSL',
  'DB_SSL_REJECT_UNAUTHORIZED',
  'DB_SSL_CA',
];
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

let backupDir;

const succeedWithDump = (contents = '-- dump\n') => {
  execFileMock.mockImplementation((file, args, options, callback) => {
    const target = args[args.indexOf('--file') + 1];
    fs.writeFileSync(target, contents);
    callback(null, '', '');
  });
};

beforeEach(() => {
  backupDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bizflow-backup-'));
  process.env.BACKUP_DIR = backupDir;
  ENV_KEYS.forEach((key) => delete process.env[key]);
  execFileMock.mockReset();
});

afterEach(() => {
  fs.rmSync(backupDir, { recursive: true, force: true });
});

afterAll(() => {
  Object.entries(originalEnv).forEach(([key, value]) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  });
});

describe('createBackup', () => {
  it('rejects unsupported labels without invoking pg_dump', async () => {
    const result = await createBackup('../../etc/passwd');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported backup label');
    expect(execFileMock).not.toHaveBeenCalled();
  });

  it('keeps credentials out of argv and writes the dump atomically', async () => {
    process.env.DATABASE_URL = 'postgresql://user:secret@db:5432/bizflow';
    succeedWithDump();

    const result = await createBackup('manual');

    expect(result.success).toBe(true);
    expect(result.size).toBeGreaterThan(0);

    const [binary, args, options] = execFileMock.mock.calls[0];
    expect(binary).toBe('pg_dump');
    expect(args).not.toContain(process.env.DATABASE_URL);
    expect(args.some((arg) => String(arg).includes('secret'))).toBe(false);
    expect(options.env.PGDATABASE).toBe(process.env.DATABASE_URL);

    const files = fs.readdirSync(backupDir);
    expect(files).toEqual([result.filename]);
    expect(files.some((file) => file.endsWith('.partial'))).toBe(false);
  });

  it('maps individual DB settings to libpq environment variables', async () => {
    process.env.DB_HOST = 'db';
    process.env.DB_PORT = '5433';
    process.env.DB_NAME = 'bizflow';
    process.env.DB_USER = 'app user';
    process.env.DB_PASSWORD = 'p@ss word';
    process.env.DB_SSL = 'true';
    process.env.DB_SSL_REJECT_UNAUTHORIZED = 'false';
    succeedWithDump();

    const result = await createBackup('daily');
    const [, , options] = execFileMock.mock.calls[0];

    expect(result.success).toBe(true);
    expect(options.env.PGHOST).toBe('db');
    expect(options.env.PGPORT).toBe('5433');
    expect(options.env.PGDATABASE).toBe('bizflow');
    expect(options.env.PGUSER).toBe('app user');
    expect(options.env.PGPASSWORD).toBe('p@ss word');
    expect(options.env.PGSSLMODE).toBe('require');
  });

  it('removes partial output and reports the pg_dump error', async () => {
    execFileMock.mockImplementation((file, args, options, callback) => {
      fs.writeFileSync(args[args.indexOf('--file') + 1], 'incomplete');
      const error = new Error('Command failed');
      error.stderr = 'pg_dump: error: connection to server failed';
      callback(error, '', error.stderr);
    });

    const result = await createBackup('manual');

    expect(result.success).toBe(false);
    expect(result.error).toContain('connection to server failed');
    expect(fs.readdirSync(backupDir)).toHaveLength(0);
  });

  it('rotates old backups only after a successful dump', async () => {
    const existing = [];
    for (let day = 1; day <= 11; day++) {
      const name = `bizflow_manual_2026-01-${String(day).padStart(2, '0')}-00-00-000.sql`;
      fs.writeFileSync(path.join(backupDir, name), 'old');
      existing.push(name);
    }

    succeedWithDump();
    const result = await createBackup('manual');

    const manual = fs.readdirSync(backupDir).filter((file) => file.includes('_manual_'));
    expect(result.success).toBe(true);
    expect(manual).toHaveLength(10);
    expect(fs.existsSync(path.join(backupDir, existing[0]))).toBe(false);
    expect(fs.existsSync(path.join(backupDir, existing[1]))).toBe(false);
    expect(fs.existsSync(path.join(backupDir, existing[10]))).toBe(true);
  });
});
