// lib/invalidateCache.ts
import redis from './redis'

// Call this when new chapter is published etc.
export async function invalidateCache(...keys: string[]) {
  await redis.del(...keys)
}

// Invalidate by pattern e.g. all chapters of a manga
export async function invalidateCachePattern(pattern: string) {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) await redis.del(...keys)
}