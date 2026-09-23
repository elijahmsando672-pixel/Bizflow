import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import sql from 'mssql';
import { SCHEMA_SQL } from './schema.tsql.js';

dotenv.config();

// ========================================
// SQL Server connection config
// ========================================

const hasConnectionString = Boolean(process.env.DB_CONNECTION_STRING);

const dbConfig = hasConnectionString
  ? process.env.DB_CONNECTION_STRING
  : {
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || '',
      server: process.env.DB_SERVER || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
      database: process.env.DB_NAME || 'bizflow',
      pool: {
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
        min: 0,
        idleTimeoutMillis: 30000,
      },
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== 'false',
        enableArithAbort: true,
      },
    };

const dbName = hasConnectionString
  ? (process.env.DB_NAME || 'bizflow')
  : (process.env.DB_NAME || 'bizflow');

// ========================================
// SQL dialect translation (PostgreSQL -> T-SQL)
// ========================================

export const translateSql = (text) => String(text)
  .replace(/\$(\d+)/g, (_, n) => `@p${n}`)
  .replace(/\bnow\(\)/gi, 'GETDATE()')
  .replace(/\bCURRENT_DATE\b/gi, 'CAST(GETDATE() AS DATE)')
  .replace(/\bILIKE\b/gi, 'LIKE')
  .replace(/\bLENGTH\(/gi, 'LEN(')
  .replace(/(?<!['"])\btrue\b/gi, '1')
  .replace(/(?<!['"])\bfalse\b/gi, '0');

// ========================================
// Parameter binding
// ========================================

const bindParam = (request, name, value) => {
  if (value === null || value === undefined) {
    request.input(name, sql.NVarChar(sql.MAX), null);
    return;
  }
  if (typeof value === 'boolean') {
    request.input(name, sql.Bit, value ? 1 : 0);
    return;
  }
  if (typeof value === 'bigint') {
    request.input(name, sql.BigInt, value.toString());
    return;
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value) && Math.abs(value) < 2147483647) {
      request.input(name, sql.Int, value);
    } else if (Number.isInteger(value)) {
      request.input(name, sql.BigInt, value.toString());
    } else {
      request.input(name, sql.Decimal(18, 4), value);
    }
    return;
  }
  if (value instanceof Date) {
    request.input(name, sql.DateTime2, value);
    return;
  }
  if (typeof value === 'string') {
    request.input(name, sql.NVarChar(sql.MAX), value);
    return;
  }
  if (typeof value === 'object') {
    request.input(name, sql.NVarChar(sql.MAX), JSON.stringify(value));
    return;
  }
  request.input(name, value);
};

const bindParams = (request, params) => {
  if (!Array.isArray(params)) return;
  params.forEach((value, index) => bindParam(request, `p${index + 1}`, value));
};

const toResult = (result) => ({
  rows: Array.isArray(result.recordset) ? result.recordset : [],
  rowCount: Array.isArray(result.rowsAffected) && result.rowsAffected.length
    ? result.rowsAffected[0]
    : (Array.isArray(result.recordset) ? result.recordset.length : 0),
});

// ========================================
// Compat client (transacted) - mirrors pg client from pool.connect()
// ========================================

class CompatClient {
  constructor(pool) {
    this._pool = pool;
    this._tx = null;
  }

  async _run(text, params) {
    const upper = text.trim().toUpperCase();
    if (upper.startsWith('BEGIN')) {
      if (!this._tx) {
        const connection = await this._pool._ensure();
        this._tx = new sql.Transaction(connection);
        await this._tx.begin();
      }
      return { rows: [], rowCount: 0 };
    }
    if (upper.startsWith('COMMIT')) {
      if (this._tx) {
        await this._tx.commit();
        this._tx = null;
      }
      return { rows: [], rowCount: 0 };
    }
    if (upper.startsWith('ROLLBACK')) {
      if (this._tx) {
        await this._tx.rollback();
        this._tx = null;
      }
      return { rows: [], rowCount: 0 };
    }

    const request = this._tx ? new sql.Request(this._tx) : new sql.Request(await this._pool._ensure());
    bindParams(request, params);
    const result = await request.query(translateSql(text));
    return toResult(result);
  }

  async query(text, params) {
    return this._run(text, params);
  }

  async connect() {
    return this;
  }

  release() {
    // Pooled in mssql; nothing to release.
  }

  end() {
    // No-op for compatibility.
  }
}

// ========================================
// Compat pool - mirrors the pg Pool API
// ========================================

class CompatPool {
  constructor() {
    this._pool = null;
    this._connecting = null;
    this._errorHandlers = [];
  }

  async _ensure() {
    if (this._pool && this._pool.connected) return this._pool;

    if (!this._pool) {
      this._pool = new sql.ConnectionPool(dbConfig);
      this._pool.on('error', (err) => {
        console.error('Unexpected pool error:', err.message);
        this._errorHandlers.forEach((fn) => {
          try { fn(err); } catch { /* ignore handler errors */ }
        });
      });
    }

    if (!this._pool.connected) {
      if (!this._connecting) {
        this._connecting = this._pool.connect().finally(() => {
          this._connecting = null;
        });
      }
      await this._connecting;
    }

    return this._pool;
  }

  async query(text, params) {
    const connection = await this._ensure();
    const request = connection.request();
    bindParams(request, params);
    const result = await request.query(translateSql(text));
    return toResult(result);
  }

  async connect() {
    await this._ensure();
    return new CompatClient(this);
  }

  async end() {
    if (this._pool && this._pool.connected) {
      await this._pool.close();
    }
  }

  on(event, handler) {
    if (event === 'error') this._errorHandlers.push(handler);
    return this;
  }

  removeListener(event, handler) {
    if (event === 'error') this._errorHandlers = this._errorHandlers.filter((fn) => fn !== handler);
  }
}

export const pool = new CompatPool();

export const query = (text, params) => pool.query(text, params);

// ========================================
// Database initialization (schema + migrations)
// ========================================

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const createDatabaseIfMissing = async () => {
  if (hasConnectionString) return;
  const masterConfig = typeof dbConfig === 'object'
    ? { ...dbConfig, database: 'master' }
    : dbConfig;

  const master = new sql.ConnectionPool(masterConfig);
  try {
    await master.connect();
    const check = await master.request().query(
      `SELECT DB_ID(N'${String(dbName).replace(/'/g, "''")}') AS dbid`
    );
    if (!check.recordset[0] || !check.recordset[0].dbid) {
      await master.request().query(
        `CREATE DATABASE [${String(dbName).replace(/]/g, ']]')}]`
      );
      console.log(`Created database ${dbName}`);
    }
  } catch (err) {
    console.error(`Could not ensure database exists (${err.message})`);
  } finally {
    try { await master.close(); } catch { /* ignore */ }
  }
};

export const initDatabase = async (retries = 10, baseDelay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await createDatabaseIfMissing();

      // Test connection before running schema
      await pool.query('SELECT 1');
      console.log(`DB connection established (attempt ${attempt})`);

      await pool.query(SCHEMA_SQL);
      console.log('Database schema initialized successfully');

      // Run pending migrations
      await pool.query(`
        IF OBJECT_ID(N'dbo.schema_migrations', N'U') IS NULL
        CREATE TABLE dbo.schema_migrations (
          version NVARCHAR(255) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          applied_at DATETIME2 DEFAULT GETDATE()
        )
      `);

      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const migrationsDir = path.join(__dirname, '..', 'migrations');
      if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir)
          .filter((f) => f.endsWith('.sql'))
          .sort();

        for (const file of files) {
          const version = file.replace(/\.sql$/, '');
          const existing = await query(
            'SELECT 1 FROM schema_migrations WHERE version = @p1',
            [version]
          );
          if (existing.rows.length > 0) continue;

          const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          await query(migrationSql);
          await query(
            'INSERT INTO schema_migrations (version, name) VALUES (@p1, @p2)',
            [version, file]
          );
          console.log(`  Migration applied: ${file}`);
        }
      }
      return;
    } catch (err) {
      const isLast = attempt === retries;
      if (isLast) {
        console.error(`DB init failed after ${retries} attempts:`, err.message);
        throw err;
      }
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 30000);
      console.warn(`DB init attempt ${attempt}/${retries} failed: ${err.message}. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
};

export const shutdown = async () => {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (err) {
    console.error('Error closing pool:', err.message);
  }
};

export default { pool, query, initDatabase, shutdown };