const store = new Map();
const timers = new Map();
const MAX_KEYS = 5000;

const getKey = (key) => `cache:${key}`;

export const cacheGet = (key) => {
  const k = getKey(key);
  const entry = store.get(k);
  if (!entry) return null;
  if (entry.expires && Date.now() > entry.expires) {
    store.delete(k);
    timers.delete(k);
    return null;
  }
  return entry.value;
};

export const cacheSet = (key, value, ttlMs = 300000) => {
  const k = getKey(key);
  if (store.size >= MAX_KEYS) {
    const oldest = store.entries().next().value;
    if (oldest) store.delete(oldest[0]);
  }
  if (timers.has(k)) clearTimeout(timers.get(k));
  store.set(k, { value, expires: Date.now() + ttlMs });
  timers.set(k, setTimeout(() => { store.delete(k); timers.delete(k); }, ttlMs));
  return value;
};

export const cacheDel = (key) => {
  const k = getKey(key);
  store.delete(k);
  if (timers.has(k)) { clearTimeout(timers.get(k)); timers.delete(k); }
};

export const cacheFlush = (pattern) => {
  if (!pattern) { store.clear(); for (const t of timers.values()) clearTimeout(t); timers.clear(); return; }
  for (const [k] of store) {
    if (k.includes(pattern)) { store.delete(k); if (timers.has(k)) { clearTimeout(timers.get(k)); timers.delete(k); } }
  }
};

export const cacheWrap = async (key, fn, ttlMs = 300000) => {
  const cached = cacheGet(key);
  if (cached !== null) return cached;
  const value = await fn();
  return cacheSet(key, value, ttlMs);
};

setInterval(() => {
  const now = Date.now();
  for (const [k, entry] of store) {
    if (entry.expires && now > entry.expires) { store.delete(k); timers.delete(k); }
  }
}, 60000);
