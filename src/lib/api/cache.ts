const CACHE_TTL_MS = 30_000
const MAX_RESPONSE_CACHE_ENTRIES = 250

export type ListOptions = { limit?: number; offset?: number }

type CacheEntry<T> = { value: T; expiresAt: number }
const responseCache = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()
const fetchGeneration = new Map<string, number>()

function readCache<T>(key: string): T | null {
  const now = Date.now()
  const entry = responseCache.get(key)
  if (!entry) return null
  if (entry.expiresAt <= now) {
    responseCache.delete(key)
    return null
  }
  responseCache.delete(key)
  responseCache.set(key, entry)
  return entry.value as T
}

function writeCache<T>(key: string, value: T, ttlMs = CACHE_TTL_MS): T {
  const had = responseCache.has(key)
  if (!had && responseCache.size >= MAX_RESPONSE_CACHE_ENTRIES) {
    const oldest = responseCache.keys().next().value as string | undefined
    if (oldest) responseCache.delete(oldest)
  }
  responseCache.set(key, { value, expiresAt: Date.now() + ttlMs })
  return value
}

export function invalidateCache(prefixes: string[]): void {
  if (prefixes.length === 0) return
  const keysToBump = new Set<string>()
  for (const key of responseCache.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) keysToBump.add(key)
  }
  for (const key of inflight.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) keysToBump.add(key)
  }
  for (const key of keysToBump) {
    responseCache.delete(key)
    inflight.delete(key)
    fetchGeneration.set(key, (fetchGeneration.get(key) ?? 0) + 1)
  }
}

export async function dedupedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = readCache<T>(key)
  if (cached !== null) return cached
  const existing = inflight.get(key) as Promise<T> | undefined
  if (existing) return existing
  const genAtStart = fetchGeneration.get(key) ?? 0
  const handle: { p: Promise<T> | null } = { p: null }
  handle.p = (async () => {
    try {
      const result = await fetcher()
      if ((fetchGeneration.get(key) ?? 0) !== genAtStart) {
        return result
      }
      return writeCache(key, result)
    } finally {
      const current = inflight.get(key)
      if (current === handle.p) {
        inflight.delete(key)
      }
    }
  })()
  inflight.set(key, handle.p)
  return handle.p
}
