import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const connectionString = process.env.TEST_DATABASE_URL;
const describeWithDatabase = connectionString ? describe : describe.skip;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const run = (args, env = {}) =>
  new Promise((resolve) => {
    execFile(
      process.execPath,
      [path.join(ROOT, 'bin', 'migrate.js'), ...args],
      {
        cwd: ROOT,
        env: {
          ...process.env,
          DATABASE_URL: process.env.TEST_DATABASE_URL,
          SQLSERVER_URL: '',
          ...env,
        },
      },
      (error, stdout, stderr) => {
        resolve({ code: error ? error.code ?? 1 : 0, stdout, stderr });
      }
    );
  });

describeWithDatabase('migrate command guards', () => {
  it('refuses to migrate without explicit confirmation', async () => {
    const result = await run(['migrate']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Refusing to migrate without --yes');
  });

  it('refuses to migrate without a SQL Server source', async () => {
    const result = await run(['migrate', '--yes']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('SQLSERVER_URL or --source-metadata is required to migrate');
  });

  it('refuses to verify without a SQL Server source', async () => {
    const result = await run(['verify']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('SQLSERVER_URL is required to verify');
  });

  it('refuses to migrate without a PostgreSQL target', async () => {
    const result = await run(['migrate', '--yes'], { DATABASE_URL: '' });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('DATABASE_URL');
  });

  it('never allows rows to be dropped silently', async () => {
    const result = await run([
      'migrate',
      '--yes',
      '--skip-bad-rows',
      '--source-metadata',
      'fixtures/legacy-source-metadata.json',
    ]);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('--skip-bad-rows requires --quarantine');
  });

  it('rejects unknown commands with usage', async () => {
    const result = await run(['destroy']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Usage: node bin/migrate.js <plan|migrate|verify>');
  });
});

describeWithDatabase('plan command', () => {
  it('plans the whole legacy schema offline and writes a report', async () => {
    const result = await run(['plan', '--source-metadata', 'fixtures/legacy-source-metadata.json']);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Tables copied: 66');
    expect(result.stdout).toContain('Columns copied: 700');
    expect(result.stdout).toContain('Report written to');
    expect(result.stdout).not.toContain('Warnings');
  });

  it('fails clearly when the metadata file is missing', async () => {
    const result = await run(['plan', '--source-metadata', 'fixtures/does-not-exist.json']);
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/ENOENT|no such file/i);
  });

  it('limits the plan to the requested tables', async () => {
    const result = await run([
      'plan',
      '--source-metadata',
      'fixtures/legacy-source-metadata.json',
      '--tables',
      'businesses,sales',
    ]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Tables copied: 2');
  });
});
