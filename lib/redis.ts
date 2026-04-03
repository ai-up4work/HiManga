// lib/redis.ts
import Redis from 'ioredis'

const globalForRedis = global as typeof globalThis & { redis?: Redis }

if (!globalForRedis.redis) {
  globalForRedis.redis = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) return null
      return Math.min(times * 200, 2000)
    },
  })

  globalForRedis.redis.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message)
  })
}

const redis = globalForRedis.redis
export default redis