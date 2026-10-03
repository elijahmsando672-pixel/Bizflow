// A shared rate limit store backed by Upstash Redis.
//
// express-rate-limit defaults to MemoryStore, which lives inside one process. On
// Vercel every function invocation can be a different instance, so an in-memory
// counter only throttles a single warm instance and an attacker simply spreads
// requests across them. Auth endpoints are the one place worth paying for a shared
// store, so those limiters use this; everything else still falls back to memory.
//
// Only the Upstash REST endpoint is used, so there is no Redis client dependency and
// nothing to keep warm between invocations.

const DEFAULT_PREFIX = 'bizflow:ratelimit';
const COMMAND_TIMEOUT_MS = 2000;

// Keys are namespaced and hashed to a fixed length. Raw client IPs in a key name are
// avoidable, and this keeps every key well inside Redis' practical key limits.
const sanitizeSegment = (value) =>
  String(value)
    .replace(/[^a-zA-Z0-9_.:-]/g, '_')
    .slice(0, 64);

export class UpstashRateLimitStore {
  constructor(options = {}) {
    this.url = (options.url || '').replace(/\/+$/, '');
    this.token = options.token || '';
    this.prefix = options.prefix || DEFAULT_PREFIX;
    this.windowMs = options.windowMs || 15 * 60 * 1000;
    this.call = options.call || defaultCall;
  }

  // express-rate-limit passes the window and key prefix in during middleware setup.
  init(options = {}) {
    if (options.windowMs) this.windowMs = options.windowMs;
    if (options.prefix) this.prefix = `${this.prefix}:${sanitizeSegment(options.prefix)}`;
  }

  async command(commands) {
    const res = await this.call(this.url, this.token, commands);
    if (!Array.isArray(res)) {
      throw new Error('Upstash rate limit store expected a pipeline result');
    }
    return res.map((entry) => entry?.result ?? null);
  }

  buildKey(key) {
    return `${this.prefix}:${sanitizeSegment(key)}`;
  }

  // INCR creates the counter, PEXPIRE NX stamps the window on the first hit only, and
  // PTTL reports what is left of it. One pipeline so the read cannot race another
  // instance's increment.
  async increment(key) {
    const redisKey = this.buildKey(key);
    const [totalHits, , ttl] = await this.command([
      ['INCR', redisKey],
      ['PEXPIRE', redisKey, String(this.windowMs), 'NX'],
      ['PTTL', redisKey],
    ]);

    const remaining = Number.isFinite(ttl) && ttl > 0 ? ttl : this.windowMs;
    return { totalHits: Number(totalHits) || 0, resetTime: new Date(Date.now() + remaining) };
  }

  // Used by skipSuccessfulRequests: a successful login should not count against the
  // caller, and the count must not go negative.
  async decrement(key) {
    const redisKey = this.buildKey(key);
    const [value, ttl] = await this.command([['DECR', redisKey], ['PTTL', redisKey]]);
    const remaining = Number.isFinite(ttl) && ttl > 0 ? ttl : this.windowMs;

    if (Number(value) < 0) {
      await this.command([['SET', redisKey, '0', 'PX', String(remaining)]]);
    }

    return { totalHits: Number(value) > 0 ? Number(value) : 0, resetTime: new Date(Date.now() + remaining) };
  }

  async resetKey(key) {
    await this.command([['DEL', this.buildKey(key)]]);
  }

  // No cheap safe way to clear every tenant's counters; this is only reached by tests
  // and by an explicit administrative reset, so surface that it did nothing rather
  // than pretending it succeeded.
  async resetAll() {
    throw new Error('UpstashRateLimitStore.resetAll is not supported; keys expire on their own');
  }

  shutdown() {}
}

const defaultCall = async (url, token, commands) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), COMMAND_TIMEOUT_MS);

  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Upstash pipeline failed: ${res.status} ${res.statusText}`);
    }

    return res.json();
  } finally {
    clearTimeout(timer);
  }
};

export const upstashRateLimitConfig = (env = process.env) => {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ''), token };
};

// An in-memory store is not a security control on a serverless host, so say so once at
// boot rather than leaving a weak limit to be discovered during an incident.
export const warnIfRateLimitsArePerInstance = (env = process.env) => {
  if (upstashRateLimitConfig(env)) return;

  const serverless = Boolean(env.VERCEL || env.NETLIFY || env.AWS_LAMBDA_FUNCTION_NAME || env.FUNCTIONS_WORKER_RUNTIME);

  if (env.NODE_ENV === 'production' && serverless) {
    console.warn(
      '[ratelimit] WARNING: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set, so rate limits ' +
      'are counted per instance. On a serverless host every warm instance keeps its own counters, which makes ' +
      'the auth limit (5 attempts / 15 min) far weaker than it appears. Configure Upstash to make it shared.'
    );
  }
};