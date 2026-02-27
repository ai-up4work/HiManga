// lib/cacheTTL.ts
export const TTL = {
  WEEK: 604800,   // 7 days  - static content (panel URLs, manga meta)
  DAY: 86400,     // 1 day   - semi-static (chapter lists, manga info)
  HOUR: 3600,     // 1 hour  - dynamic (user library, reading progress)
}