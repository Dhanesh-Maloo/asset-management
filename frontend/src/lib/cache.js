// Simple in-memory cache with TTL (time-to-live)
// Prevents re-fetching the same data on every page visit within the TTL window.

const store = {};
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds

export const cache = {
  get(key) {
    const entry = store[key];
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      delete store[key];
      return null;
    }
    return entry.data;
  },

  set(key, data, ttlMs = DEFAULT_TTL_MS) {
    store[key] = { data, expiresAt: Date.now() + ttlMs };
  },

  invalidate(key) {
    delete store[key];
  },

  invalidatePrefix(prefix) {
    Object.keys(store).forEach(k => { if (k.startsWith(prefix)) delete store[k]; });
  },

  clear() {
    Object.keys(store).forEach(k => delete store[k]);
  },
};

// Cached axios GET — returns cached data if fresh, otherwise fetches and caches
export async function cachedGet(axiosInstance, url, params = {}, ttlMs = DEFAULT_TTL_MS) {
  const key = url + JSON.stringify(params);
  const hit = cache.get(key);
  if (hit !== null) return { data: hit };
  const res = await axiosInstance.get(url, { params });
  cache.set(key, res.data, ttlMs);
  return res;
}
