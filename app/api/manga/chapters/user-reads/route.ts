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
  await redis.del(getCacheKey(userId));
}

// ── DB stores chapters as text[] — always normalize to numbers on the way out
function normalizeChapters(chapters: any[]): number[] {
  return (chapters || [])
    .map((ch) => parseFloat(String(ch)))
    .filter((ch) => !isNaN(ch))
    .sort((a, b) => a - b);
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

  const cacheKey = getCacheKey(userId, mangaId || undefined);
  if (!skipCache) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`[User Reads] Cache HIT: user=${userId}, manga=${mangaId || 'all'}`);
        return NextResponse.json(JSON.parse(cached as string), {
          headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400", "X-Cache": "HIT" },
        });
      }
    } catch (cacheErr) {
      console.warn("[User Reads] Redis GET error:", cacheErr);
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
      return NextResponse.json({ error: error.message, readChapters: [] }, { status: 500 });
    }

    if (mangaId) {
      const mangaRead = data?.[0];
      // ✅ Normalize text[] → number[] before returning
      const readChapters = normalizeChapters(mangaRead?.chapters || []);
      const responseData = { mangaId, readChapters };

      try { await redis.set(cacheKey, JSON.stringify(responseData), 'EX', TTL.HOUR); } catch {}

      return NextResponse.json(responseData, {
        headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400", "X-Cache": "MISS" },
      });
    }

    const userReads = data?.map((item) => ({
      mangaId: item.manga_id,
      // ✅ Normalize text[] → number[] for each manga
      readChapters: normalizeChapters(item.chapters || []),
    })) || [];

    const responseData = { userId, reads: userReads, totalManga: userReads.length };

    try { await redis.set(cacheKey, JSON.stringify(responseData), 'EX', TTL.HOUR); } catch {}

    return NextResponse.json(responseData, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400", "X-Cache": "MISS" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error", readChapters: [] }, { status: 500 });
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

    // ✅ Normalize existing text[] chapters to numbers first
    let currentChapters: number[] = normalizeChapters(
      existingRecord && !fetchError ? (existingRecord.chapters || []) : []
    );

    const numChapter = parseFloat(String(chapterNumber));
    if (!isNaN(numChapter) && !currentChapters.includes(numChapter)) {
      currentChapters.push(numChapter);
      currentChapters.sort((a, b) => a - b);
    }

    // ✅ Store back as strings to match text[] column type
    const chaptersAsStrings = currentChapters.map(String);

    const { error } = await supabase
      .from("user_reads")
      .upsert(
        {
          user_id: userId,
          manga_id: mangaId,
          chapters: chaptersAsStrings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,manga_id" }
      )
      .select();

    if (error) {
      console.error("Upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await invalidateUserReadsCache(userId, mangaId);

    return NextResponse.json({
      success: true,
      readChapters: currentChapters, // return as numbers for the frontend
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

    // ✅ Normalize, filter, then store back as strings
    const currentChapters = normalizeChapters(existingRecord.chapters || []);
    const numToRemove = parseFloat(chapterNumber);
    const updatedChapters = currentChapters.filter((ch) => ch !== numToRemove);
    const updatedChaptersAsStrings = updatedChapters.map(String);

    const { error: updateError } = await supabase
      .from("user_reads")
      .update({
        chapters: updatedChaptersAsStrings,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("manga_id", mangaId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await invalidateUserReadsCache(userId, mangaId);

    return NextResponse.json({
      success: true,
      readChapters: updatedChapters, // return as numbers for the frontend
      message: `Chapter ${chapterNumber} unmarked as read`,
      cacheInvalidated: true,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}