import { describe, it, expect, afterEach, vi } from 'vitest';
import request from 'supertest';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildInitConfig,
  buildPoolConfig,
  isServerless,
  isSupabase,
  isTransactionPooler,
  pool,
} from '../config/db.js';
import app, { configuration, getAllowedOrigins } from '../app.js';

const POOLER_URL = 'postgresql://postgres.projref:pw@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
const SESSION_POOLER_URL = 'postgresql://postgres.projref:pw@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
const DIRECT_URL = 'postgresql://postgres.projref:pw@db.projref.supabase.co:5432/postgres';
const LOCAL_URL = 'postgresql://postgres:postgres@localhost:5432/bizflow';

describe('runtime detection', () => {
  it('detects serverless platforms', () => {
    expect(isServerless({ VERCEL: '1' })).toBe(true);
    expect(isServerless({ AWS_LAMBDA_FUNCTION_NAME: 'fn' })).toBe(true);
    expect(isServerless({ NODE_ENV: 'production' })).toBe(false);
  });

  it('detects Supabase hosts including the pooler', () => {
    expect(isSupabase({ SUPABASE_DB_URL: DIRECT_URL })).toBe(true);
    expect(isSupabase({ SUPABASE_POOLER_URL: POOLER_URL })).toBe(true);
    expect(isSupabase({ SUPABASE_POOLER_URL: SESSION_POOLER_URL })).toBe(true);
    expect(isSupabase({ DB_HOST: 'db.projref.supabase.co' })).toBe(true);
    expect(isSupabase({ DB_HOST: 'localhost', DB_PORT: '5432' })).toBe(false);
    expect(isSupabase({})).toBe(false);
  });

  it('resolves the hostname from whichever target the pool actually connects to', () => {
    // A stale DB_HOST alongside a Supabase URL used to mask the Supabase hostname,
    // which switched off TLS entirely for a connection that really was Supabase.
    expect(isSupabase({ DB_HOST: 'localhost', SUPABASE_POOLER_URL: POOLER_URL })).toBe(true);
    expect(isSupabase({ DB_HOST: 'localhost', DATABASE_URL: DIRECT_URL })).toBe(true);
    expect(isSupabase({ DB_HOST: 'localhost', SUPABASE_POOLER_URL: LOCAL_URL })).toBe(false);
  });

  it('only treats port 6543 as the transaction pooler', () => {
    expect(isTransactionPooler({ SUPABASE_POOLER_URL: POOLER_URL })).toBe(true);
    expect(isTransactionPooler({ SUPABASE_POOLER_URL: SESSION_POOLER_URL })).toBe(false);
    expect(isTransactionPooler({ SUPABASE_DB_URL: DIRECT_URL })).toBe(false);
    expect(isTransactionPooler({ DB_HOST: 'db.projref.supabase.co', DB_PORT: '6543' })).toBe(true);
    expect(isTransactionPooler({ DB_HOST: 'db.projref.supabase.co', DB_PORT: '5432' })).toBe(false);
  });
});

describe('local development CORS origins', () => {
  it('allows the Next.js fallback port when port 3000 is occupied', () => {
    const origins = getAllowedOrigins({});
    expect(origins).toContain('http://localhost:3001');
    expect(origins).toContain('http://127.0.0.1:3001');
  });
});

describe('pool configuration', () => {
  it('keeps a large pool for long running hosts', () => {
    const config = buildPoolConfig({ DB_HOST: 'localhost', DB_PORT: '5432' });
    expect(config.max).toBe(20);
    expect(config.idleTimeoutMillis).toBe(30000);
    expect(config.ssl).toBeUndefined();
    expect(config.application_name).toBe('bizflow-api');
  });

  it('still honours a legacy DATABASE_URL instead of silently using localhost', () => {
    const config = buildPoolConfig({ DB_HOST: 'localhost', DATABASE_URL: DIRECT_URL, DB_SSL_CA_PEM: 'CA-PEM' });
    expect(config.connectionString).toBe(DIRECT_URL);
    expect(config.ssl).toEqual({ rejectUnauthorized: true, ca: 'CA-PEM' });
  });

  it('refuses to build an unencrypted pool for a masked Supabase target', () => {
    expect(() =>
      buildPoolConfig({ DB_HOST: 'localhost', SUPABASE_POOLER_URL: POOLER_URL, NODE_ENV: 'production' })
    ).toThrow(/DB_SSL_CA/);
  });

  it('collapses to a single connection per serverless instance', () => {
    const config = buildPoolConfig({ VERCEL: '1', SUPABASE_POOLER_URL: SESSION_POOLER_URL });
    expect(config.max).toBe(1);
    expect(config.idleTimeoutMillis).toBe(1000);
    expect(config.application_name).toBe('bizflow-api-serverless');
  });

  it('verifies the Supabase certificate once its CA is pinned', () => {
    const config = buildPoolConfig({ SUPABASE_DB_URL: DIRECT_URL, DB_SSL_CA_PEM: 'CA-PEM' });
    expect(config.ssl).toEqual({ rejectUnauthorized: true, ca: 'CA-PEM' });
  });

  it('degrades to unverified TLS for Supabase without a CA outside production', () => {
    const config = buildPoolConfig({ SUPABASE_DB_URL: DIRECT_URL, NODE_ENV: 'test' });
    expect(config.ssl).toEqual({ rejectUnauthorized: false });
  });

  it('refuses to start in production when the Supabase CA is missing', () => {
    expect(() => buildPoolConfig({ SUPABASE_DB_URL: DIRECT_URL, NODE_ENV: 'production' })).toThrow(/DB_SSL_CA/);
  });

  it('keeps certificate verification on when it is explicitly requested', () => {
    const config = buildPoolConfig({ SUPABASE_DB_URL: DIRECT_URL, DB_SSL_REJECT_UNAUTHORIZED: 'true', DB_SSL_CA_PEM: 'CA-PEM' });
    expect(config.ssl).toEqual({ rejectUnauthorized: true, ca: 'CA-PEM' });
  });

  it('allows an explicit opt out of verification', () => {
    const config = buildPoolConfig({ SUPABASE_DB_URL: DIRECT_URL, DB_SSL_REJECT_UNAUTHORIZED: 'false' });
    expect(config.ssl).toEqual({ rejectUnauthorized: false });
  });

  it('enables TLS for any host when DB_SSL is set', () => {
    const config = buildPoolConfig({ DB_HOST: 'localhost', DB_PORT: '5432', DB_SSL: 'true' });
    expect(config.ssl).toEqual({ rejectUnauthorized: true });
  });

  it('disables the client statement cache behind the transaction pooler', () => {
    expect(buildPoolConfig({ SUPABASE_POOLER_URL: POOLER_URL }).options).toBe('-c statement_cache_size=0');
    expect(buildPoolConfig({ SUPABASE_POOLER_URL: SESSION_POOLER_URL }).options).toBeUndefined();
  });

  it('honours explicit pool overrides', () => {
    const config = buildPoolConfig({ VERCEL: '1', SUPABASE_POOLER_URL: SESSION_POOLER_URL, DB_POOL_MAX: '4' });
    expect(config.max).toBe(4);
  });

  it('falls back to individual connection fields without a URL', () => {
    const config = buildPoolConfig({ DB_HOST: 'db.internal', DB_NAME: 'bizflow', DB_USER: 'app', DB_PASSWORD: 'pw' });
    expect(config).toMatchObject({ host: 'db.internal', port: 5432, database: 'bizflow', user: 'app', password: 'pw' });
  });
});

describe('schema initialization connection', () => {
  it('refuses to run DDL through the transaction pooler', () => {
    expect(() => buildInitConfig({ SUPABASE_POOLER_URL: POOLER_URL })).toThrow(/DB_INIT_URL/);
  });

  it('uses DB_INIT_URL when the pooler URL is set', () => {
    const config = buildInitConfig({
      SUPABASE_POOLER_URL: POOLER_URL,
      DB_INIT_URL: DIRECT_URL,
      NODE_ENV: 'test',
    });
    expect(config.connectionString).toBe(DIRECT_URL);
    expect(config.ssl).toEqual({ rejectUnauthorized: false });
  });

  it('refuses unverified schema initialization against production Supabase', () => {
    expect(() =>
      buildInitConfig({ SUPABASE_POOLER_URL: POOLER_URL, DB_INIT_URL: DIRECT_URL, NODE_ENV: 'production' })
    ).toThrow(/Schema initialization/);
  });

  it('uses the application URL when it is not a transaction pooler', () => {
    const config = buildInitConfig({ SUPABASE_POOLER_URL: SESSION_POOLER_URL });
    expect(config.connectionString).toBe(SESSION_POOLER_URL);
  });
});

describe('configuration reporting', () => {
  it('reports missing variables instead of throwing', () => {
    const report = configuration({ NODE_ENV: 'production' });
    expect(report.missing).toEqual(expect.arrayContaining(['JWT_SECRET']));
  });

  it('accepts a Supabase URL in place of the individual fields', () => {
    const report = configuration({ JWT_SECRET: 'a'.repeat(40), SUPABASE_POOLER_URL: SESSION_POOLER_URL });
    expect(report.missing).toEqual([]);
  });

  it('warns about the default JWT secret in production', () => {
    const report = configuration({
      JWT_SECRET: 'bizflow-secret-key-change-in-production',
      SUPABASE_POOLER_URL: SESSION_POOLER_URL,
      NODE_ENV: 'production',
      APP_URL: 'https://bizflow.vercel.app',
    });
    expect(report.missing).toEqual([]);
    expect(report.warnings.join(' ')).toMatch(/JWT_SECRET/);
  });
});

describe('function path handling', () => {
  it('leaves API paths untouched', async () => {
    const { restorePath } = await import('../vercel-handler.js');
    expect(restorePath('/api/customers?page=2')).toBe('/api/customers?page=2');
  });

  it('restores the OAuth alias that vercel.json rewrites', async () => {
    const { restorePath } = await import('../vercel-handler.js');
    expect(restorePath('/api/_auth/google/callback')).toBe('/auth/google/callback');
    expect(restorePath('/api/_auth')).toBe('/auth');
  });
});

describe('serverless health check', () => {
  const original = { JWT_SECRET: process.env.JWT_SECRET, VERCEL: process.env.VERCEL };

  afterEach(() => {
    if (original.JWT_SECRET === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original.JWT_SECRET;
    if (original.VERCEL === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = original.VERCEL;
    vi.restoreAllMocks();
  });

  it('reports unavailable instead of crashing when configuration is incomplete', async () => {
    delete process.env.JWT_SECRET;
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(503);
  });

  it('reports ok when configuration is complete and the database answers', async () => {
    process.env.JWT_SECRET = 'a'.repeat(40);
    vi.spyOn(pool, 'query').mockResolvedValue({ rows: [{ '?column?': 1 }] });

    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('serves API routes through the function handler', async () => {
    const { default: handler } = await import('../vercel-handler.js');
    const response = await request(handler).get('/api/version');
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('bizflow-server');
  });

  it('rejects request bodies larger than the platform allows', async () => {
    process.env.VERCEL = '1';
    process.env.PLATFORM_BODY_LIMIT_BYTES = '10';
    vi.resetModules();
    const { default: handler } = await import('../vercel-handler.js');

    const response = await request(handler)
      .post('/api/import')
      .set('Content-Type', 'application/json')
      .send({ payload: 'x'.repeat(64) });

    expect(response.status).toBe(413);
    vi.resetModules();
  });
});

describe('bootstrap safety', () => {
  it('does not take over the port or register signal handlers on import', async () => {
    const before = process.listenerCount('SIGTERM');
    const module = await import('../index.js');
    expect(typeof module.startServer).toBe('function');
    expect(process.listenerCount('SIGTERM')).toBe(before);
  });

  it('recognises its own entry point on every platform', async () => {
    const { isDirectRun } = await import('../index.js');
    const moduleUrl = new URL('../index.js', import.meta.url).href;

    expect(isDirectRun(moduleUrl, fileURLToPath(moduleUrl))).toBe(true);
    expect(isDirectRun(moduleUrl, undefined)).toBe(false);
    expect(isDirectRun(moduleUrl, fileURLToPath(new URL('../app.js', moduleUrl)))).toBe(false);
  });

  it('starts a real server when the entry file is executed directly', async () => {
    const port = 5000 + Math.floor(Math.random() * 900);
    const child = spawn(process.execPath, ['index.js'], {
      cwd: path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
      env: { ...process.env, PORT: String(port), DB_AUTO_INIT: 'false' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    try {
      const started = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('server did not start in time')), 20000);
        let output = '';
        child.stdout.on('data', (chunk) => {
          output += chunk.toString();
          if (output.includes(`Server running on port ${port}`)) {
            clearTimeout(timer);
            resolve(true);
          }
        });
        child.on('exit', (code) => {
          clearTimeout(timer);
          reject(new Error(`server exited early with code ${code}`));
        });
      });

      expect(started).toBe(true);
      const response = await fetch(`http://127.0.0.1:${port}/api/version`);
      expect(response.status).toBe(200);
      expect((await response.json()).name).toBe('bizflow-server');
    } finally {
      child.kill();
    }
  });
});

describe('vercel function entry points', () => {
  it('exports a handler from the entry file', async () => {
    const index = await import('../api/index.js');

    expect(typeof index.default).toBe('function');
    expect(index.config.maxDuration).toBe(30);
  });

  it('serves the root path through the function', async () => {
    const { default: handler } = await import('../api/index.js');
    const response = await request(handler).get('/');
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('BizFlow API');
  });
});
