import { describe, it, expect, vi } from 'vitest';
import { UpstashRateLimitStore, upstashRateLimitConfig } from '../utils/upstashRateLimitStore.js';

const url = 'https://example.upstash.io';
const token = 'token';

// A stand-in for the Upstash pipeline endpoint: applies each command to a shared map
// and returns Upstash's [{ result }] shape.
const fakePipeline = (state) =>
  vi.fn(async (_url, _token, commands) =>
    commands.map(([cmd, ...args]) => {
      const key = args[0];
      switch (cmd) {
        case 'INCR': {
          state.set(key, (state.get(key) || 0) + 1);
          return { result: state.get(key) };
        }
        case 'DECR': {
          state.set(key, (state.get(key) || 0) - 1);
          return { result: state.get(key) };
        }
        case 'PEXPIRE': {
          const current = state.get(`${key}:px`) ?? Infinity;
          if (args[2] === 'NX' && current !== Infinity) return { result: 0 };
          state.set(`${key}:px`, Number(args[1]));
          return { result: 1 };
        }
        case 'PTTL': {
          const ttl = state.get(`${key}:px`);
          return { result: ttl === undefined ? -1 : ttl };
        }
        case 'DEL': {
          state.delete(key);
          state.delete(`${key}:px`);
          return { result: 1 };
        }
        case 'SET': {
          state.set(key, Number(args[1]));
          state.set(`${key}:px`, Number(args[3]));
          return { result: 'OK' };
        }
        default:
          throw new Error(`unexpected command ${cmd}`);
      }
    })
  );

describe('upstash rate limit configuration', () => {
  it('is disabled when neither variable is set', () => {
    expect(upstashRateLimitConfig({})).toBeNull();
    expect(upstashRateLimitConfig({ UPSTASH_REDIS_REST_URL: url })).toBeNull();
    expect(upstashRateLimitConfig({ UPSTASH_REDIS_REST_TOKEN: token })).toBeNull();
  });

  it('is enabled only when both variables are present', () => {
    expect(upstashRateLimitConfig({ UPSTASH_REDIS_REST_URL: `${url}/`, UPSTASH_REDIS_REST_TOKEN: token })).toEqual({
      url,
      token,
    });
  });
});

describe('UpstashRateLimitStore', () => {
  const build = (state) =>
    new UpstashRateLimitStore({
      url,
      token,
      prefix: 'test',
      windowMs: 60_000,
      call: fakePipeline(state),
    });

  it('counts hits and reports the window end', async () => {
    const state = new Map();
    const store = build(state);

    const first = await store.increment('1.2.3.4');
    expect(first.totalHits).toBe(1);
    expect(first.resetTime.getTime()).toBeGreaterThan(Date.now());

    const second = await store.increment('1.2.3.4');
    expect(second.totalHits).toBe(2);
  });

  it('keeps the window from being extended by later hits', async () => {
    const state = new Map();
    const store = build(state);

    await store.increment('1.2.3.4');
    const ttlAfterFirst = state.get('test:1.2.3.4:px');
    await store.increment('1.2.3.4');

    expect(state.get('test:1.2.3.4:px')).toBe(ttlAfterFirst);
  });

  it('namespaces keys per limiter', async () => {
    const state = new Map();
    const auth = new UpstashRateLimitStore({ url, token, prefix: 'auth', call: fakePipeline(state) });
    const refresh = new UpstashRateLimitStore({ url, token, prefix: 'refresh', call: fakePipeline(state) });

    await auth.increment('1.2.3.4');
    await refresh.increment('1.2.3.4');

    expect(state.has('auth:1.2.3.4')).toBe(true);
    expect(state.has('refresh:1.2.3.4')).toBe(true);
  });

  it('applies the prefix express-rate-limit supplies during init', async () => {
    const state = new Map();
    const store = build(state);

    store.init({ windowMs: 5_000, prefix: 'auth' });
    await store.increment('9.9.9.9');

    expect(store.windowMs).toBe(5_000);
    expect(state.has('test:auth:9.9.9.9')).toBe(true);
  });

  it('does not let a decrement drive the counter below zero', async () => {
    const state = new Map();
    const store = build(state);

    await store.increment('1.2.3.4');
    await store.decrement('1.2.3.4');
    const afterOne = await store.increment('1.2.3.4');
    expect(afterOne.totalHits).toBe(1);

    const negative = await store.decrement('1.2.3.4');
    expect(negative.totalHits).toBe(0);
    expect(state.get('test:1.2.3.4')).toBe(0);
  });

  it('clears a key on resetKey', async () => {
    const state = new Map();
    const store = build(state);

    await store.increment('1.2.3.4');
    await store.resetKey('1.2.3.4');

    expect(state.has('test:1.2.3.4')).toBe(false);
  });

  it('refuses resetAll rather than pretending to clear every tenant', async () => {
    const store = build(new Map());
    await expect(store.resetAll()).rejects.toThrow(/not supported/);
  });

  it('strips characters that are not safe in a Redis key', async () => {
    const state = new Map();
    const store = build(state);

    await store.increment('1.2.3.4 some spaces/and\nnewlines');
    expect([...state.keys()].some((key) => key.startsWith('test:1.2.3.4_some_spaces'))).toBe(true);
  });
});