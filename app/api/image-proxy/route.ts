// app/api/image-proxy/route.js
import redis from '@/lib/redis';
import { TTL } from '@/lib/cacheTTL';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const skipCache = searchParams.get('skipCache') === 'true';

    if (!imageUrl) {
      return new Response('Missing image URL', { status: 400 });
    }

    // ✅ Cache the contentType only — not the binary image data
    const cacheKey = `image-proxy:${Buffer.from(imageUrl).toString('base64').substring(0, 50)}`;

    if (!skipCache) {
      const cachedContentType = await redis.get(cacheKey);
      if (cachedContentType) {
        // Re-fetch the image (CDN/browser handles actual image caching)
        const response = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://news.google.com/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          },
        });
        const imageBuffer = await response.arrayBuffer();
        return new Response(imageBuffer, {
          headers: {
            'Content-Type': cachedContentType,
            'Cache-Control': 'public, max-age=2592000, s-maxage=2592000',
            'X-Cache': 'HIT',
          },
        });
      }
    }

    // Fetch the image with proper headers
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://news.google.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await response.arrayBuffer();

    // ✅ Only cache the contentType in Redis — 1 week
    await redis.set(cacheKey, contentType, 'EX', TTL.WEEK);

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    const transparentPixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    return new Response(transparentPixel, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}