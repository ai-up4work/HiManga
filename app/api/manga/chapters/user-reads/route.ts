// app/api/manga/chapters/user-reads/route.ts
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
    ? `user-reads:${userId}:${mangaId}`
    : `user-reads:${userId}:all`;
}

async function invalidateUserReadsCache(userId: string, mangaId?: string) {
  if (mangaId) await redis.del(getCacheKey(userId, mangaId));
  await redis.del(getCacheKey(userId)); // always invalidate the "all" cache too
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const mangaId = searchParams.get("mangaId");
  const skipCache = searchParams.get("skipCache") === "true";

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required", readChapters: [] },
      { status: 400 }
    );
  }

  // ✅ Redis cache check
  const cacheKey = getCacheKey(userId, mangaId || undefined);
  if (!skipCache) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[User Reads] Cache HIT: user=${userId}, manga=${mangaId || 'all'}`);
      return NextResponse.json(JSON.parse(cached as string), {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          "X-Cache": "HIT",
        },
      });
    }
  }

  console.log(`[User Reads] Cache MISS: Fetching for user=${userId}, manga=${mangaId || 'all'}`);

  try {
    let query = supabase
      .from("user_reads")
      .select("manga_id, chapters")
      .eq("user_id", userId);

    if (mangaId) {
      query = query.eq("manga_id", mangaId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message, readChapters: [] },
        { status: 500 }
      );
    }

    if (mangaId) {
      const mangaRead = data?.[0];
      const responseData = {
        mangaId,
        readChapters: mangaRead?.chapters || [],
      };

      // ✅ Store in Redis — 1 hour since read status changes often
      await redis.set(cacheKey, JSON.stringify(responseData), 'EX', TTL.HOUR);

      return NextResponse.json(responseData, {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          "X-Cache": "MISS",
        },
      });
    }

    const userReads = data?.map((item) => ({
      mangaId: item.manga_id,
      readChapters: item.chapters || [],
    })) || [];

    const responseData = {
      userId,
      reads: userReads,
      totalManga: userReads.length,
    };

    // ✅ Store in Redis
    await redis.set(cacheKey, JSON.stringify(responseData), 'EX', TTL.HOUR);

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error", readChapters: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const body = await req.json();
    const { mangaId, chapterNumber } = body;

    if (!userId || !mangaId || chapterNumber === undefined) {
      return NextResponse.json(
        { error: "userId, mangaId, and chapterNumber are required" },
        { status: 400 }
      );
    }

    const { data: existingRecord, error: fetchError } = await supabase
      .from("user_reads")
      .select("chapters")
      .eq("user_id", userId)
      .eq("manga_id", mangaId)
      .single();

    let currentChapters: number[] = [];

    if (existingRecord && !fetchError) {
      currentChapters = existingRecord.chapters || [];
    }

    if (!currentChapters.includes(chapterNumber)) {
      currentChapters.push(chapterNumber);
      currentChapters.sort((a, b) => a - b);
    }

    const { data, error } = await supabase
      .from("user_reads")
      .upsert(
        {
          user_id: userId,
          manga_id: mangaId,
          chapters: currentChapters,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,manga_id" }
      )
      .select();

    if (error) {
      console.error("Upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ✅ Invalidate Redis cache after update
    await invalidateUserReadsCache(userId, mangaId);

    return NextResponse.json({
      success: true,
      readChapters: currentChapters,
      message: `Chapter ${chapterNumber} marked as read`,
      cacheInvalidated: true,
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
    const chapterNumber = searchParams.get("chapterNumber");

    if (!userId || !mangaId || !chapterNumber) {
      return NextResponse.json(
        { error: "userId, mangaId, and chapterNumber are required" },
        { status: 400 }
      );
    }

    const { data: existingRecord, error: fetchError } = await supabase
      .from("user_reads")
      .select("chapters")
      .eq("user_id", userId)
      .eq("manga_id", mangaId)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const currentChapters: number[] = existingRecord.chapters || [];
    const updatedChapters = currentChapters.filter(
      (ch) => ch !== parseInt(chapterNumber)
    );

    const { error: updateError } = await supabase
      .from("user_reads")
      .update({
        chapters: updatedChapters,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("manga_id", mangaId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // ✅ Invalidate Redis cache after deletion
    await invalidateUserReadsCache(userId, mangaId);

    return NextResponse.json({
      success: true,
      readChapters: updatedChapters,
      message: `Chapter ${chapterNumber} unmarked as read`,
      cacheInvalidated: true,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}