// lib/withCache.ts
import redis from './redis'

export async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
  skipCache = false  // 👈 add this
): Promise<T> {
  if (!skipCache) {
    const cached = await redis.get(key)
    if (cached) return JSON.parse(cached as string)
  }

  const data = await fetcher()
  await redis.set(key, JSON.stringify(data), 'EX', ttl)
  return data
}