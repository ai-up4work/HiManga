// app/api/manga/ratings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from 'next/headers';
import redis from "@/lib/redis";
import { TTL } from "@/lib/cacheTTL";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY!
);

function getCacheKey(userId: string, mangaId?: string): string {
  return mangaId
    ? `user-ratings:${userId}:${mangaId}`
    : `user-ratings:${userId}:all`;
}

async function invalidateRatingsCache(userId: string, mangaId?: string) {
  if (mangaId) await redis.del(getCacheKey(userId, mangaId));
  await redis.del(getCacheKey(userId));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const mangaId = searchParams.get("mangaId");
  const skipCache = searchParams.get("skipCache") === "true";

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required", rating: null },
      { status: 400 }
    );
  }

  // ✅ Redis cache check
  const cacheKey = getCacheKey(userId, mangaId || undefined);
  if (!skipCache) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[Ratings] Cache HIT: user=${userId}, manga=${mangaId || 'all'}`);
      return NextResponse.json({
        ...JSON.parse(cached as string),
        fromCache: true
      });
    }
  }

  try {
    let query = supabase
      .from("user_ratings")
      .select("manga_id, rating, review, created_at, updated_at")
      .eq("user_id", userId);

    if (mangaId) {
      query = query.eq("manga_id", mangaId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message, rating: null },
        { status: 500 }
      );
    }

    const userRatings = data?.map((item) => ({
      mangaId: item.manga_id,
      rating: item.rating,
      review: item.review,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })) || [];

    if (mangaId) {
      const userRating = userRatings[0];
      const responseData = {
        mangaId,
        rating: userRating?.rating || null,
        review: userRating?.review || null,
        createdAt: userRating?.createdAt,
        updatedAt: userRating?.updatedAt,
        fromCache: false
      };

      // ✅ Store in Redis — invalidation handles freshness
      await redis.set(cacheKey, JSON.stringify(responseData), 'EX', TTL.DAY);

      return NextResponse.json(responseData);
    }

    const responseData = {
      userId,
      ratings: userRatings,
      totalRatings: userRatings.length,
      fromCache: false
    };

    // ✅ Store in Redis
    await redis.set(cacheKey, JSON.stringify(responseData), 'EX', TTL.DAY);

    return NextResponse.json(responseData);
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error", rating: null },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const body = await req.json();
    const { mangaId, rating, review } = body;

    if (!userId || !mangaId || rating === undefined) {
      return NextResponse.json(
        { error: "userId, mangaId, and rating are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("user_ratings")
      .upsert(
        {
          user_id: userId,
          manga_id: mangaId,
          rating: rating,
          review: review || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,manga_id" }
      )
      .select();

    if (error) {
      console.error("Upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ✅ Invalidate Redis cache
    await invalidateRatingsCache(userId, mangaId);

    return NextResponse.json({
      success: true,
      rating: data?.[0],
      message: `Rating ${rating}/5 saved successfully`,
      cacheInvalidated: true
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const mangaId = searchParams.get("mangaId");

    if (!userId || !mangaId) {
      return NextResponse.json(
        { error: "userId and mangaId are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("user_ratings")
      .delete()
      .eq("user_id", userId)
      .eq("manga_id", mangaId);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ✅ Invalidate Redis cache
    await invalidateRatingsCache(userId, mangaId);

    return NextResponse.json({
      success: true,
      message: "Rating deleted successfully",
      cacheInvalidated: true
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}