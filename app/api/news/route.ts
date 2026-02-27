// app/api/news/route.js
import { createClient } from '@supabase/supabase-js';
import redis from '@/lib/redis';
import { TTL } from '@/lib/cacheTTL';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY
);

function getCacheKey(query, max) {
  return `news:${query}:${max}`;
}

// sanitizeGoogleNewsURL stays exactly the same
function sanitizeGoogleNewsURL(url) {
  try {
    if (!url) return url;
    const parsed = new URL(url);
    if (parsed.hostname === 'www.google.com' && parsed.pathname.startsWith('/sorry/index')) {
      const continueParam = parsed.searchParams.get('continue');
      if (continueParam) return decodeURIComponent(continueParam);
    }
    return url;
  } catch (err) {
    console.warn('Failed to sanitize URL:', url, err);
    return url;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'anime';
    const max = parseInt(searchParams.get('max') || '50', 10);
    const skipCache = searchParams.get('skipCache') === 'true';

    const cacheKey = getCacheKey(query, max);

    // ✅ Redis cache check (replaces in-memory Map)
    if (!skipCache) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`[News API] Cache HIT: ${cacheKey}`);
        return Response.json(JSON.parse(cached), {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            'X-Cache': 'HIT'
          }
        });
      }
    }

    console.log(`[News API] Cache MISS: Fetching from database for ${cacheKey}`);

    // Fetch articles from Supabase — exactly the same
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .eq('query', query)
      .gt('expires_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(max);

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to fetch news from database', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      const emptyResult = { totalArticles: 0, articles: [] };
      await redis.set(cacheKey, JSON.stringify(emptyResult), 'EX', TTL.HOUR);
      return Response.json(emptyResult, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'X-Cache': 'MISS'
        }
      });
    }

    // Transform data — exactly the same
    const articles = data.map((article) => ({
      title: article.title || 'Untitled',
      description: article.published_text || 'No description available',
      url: sanitizeGoogleNewsURL(article.article_url),
      image_url: article.image_url || null,
      publishedAt: article.published_at,
      source: {
        name: article.publisher || 'Unknown Source',
        url: sanitizeGoogleNewsURL(article.article_url)
      }
    }));

    const result = { totalArticles: articles.length, articles };

    // ✅ Store in Redis (replaces setCachedNews)
    await redis.set(cacheKey, JSON.stringify(result), 'EX', TTL.HOUR);
    console.log(`[News Cache] Cached ${articles.length} articles for key: ${cacheKey}`);

    return Response.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Cache': 'MISS'
      }
    });

  } catch (err) {
    console.error('API error:', err);
    return Response.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}