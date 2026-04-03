// app/api/manga/chapters/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import redis from "@/lib/redis";
import { TTL } from "@/lib/cacheTTL";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY!
);

async function getCached(key: string): Promise<string | null> {
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

async function setCached(key: string, value: string, ttl: number): Promise<void> {
  try {
    await redis.set(key, value, "EX", ttl);
  } catch {
    // Redis down — not fatal, just skip caching
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mangaId = searchParams.get("mangaId");
  const skipCache = searchParams.get("skipCache") === "true";

  if (!mangaId) {
    return NextResponse.json({ chapters: [] }, { status: 400 });
  }

  const cacheKey = `chapters-list:${mangaId}`;

  // ── Cache check ──────────────────────────────────────────────────────────
  if (!skipCache) {
    const cached = await getCached(cacheKey);
    if (cached) {
      const chapters = JSON.parse(cached);
      console.log(`[Chapters List] Cache HIT: manga=${mangaId}, ${chapters.length} chapters`);
      return NextResponse.json(
        { chapters },
        {
          headers: {
            "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200",
            "X-Cache": "HIT",
          },
        }
      );
    }
  }

  console.log(`[Chapters List] Cache MISS: Fetching chapters for manga=${mangaId}`);

  // ── Fetch from Supabase ──────────────────────────────────────────────────
  const allChapters: any[] = [];
  let start = 0;
  const chunkSize = 1000;

  try {
    while (true) {
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("manga_id", mangaId)
        .order("chapter_number", { ascending: true })
        .range(start, start + chunkSize - 1);

      if (error) {
        console.error("[Chapters List] Database error:", error);
        return NextResponse.json(
          { chapters: [], error: error.message },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) break;
      allChapters.push(...data);
      if (data.length < chunkSize) break;
      start += data.length;
    }

    console.log(`[Chapters List] Fetched ${allChapters.length} chapters for manga=${mangaId}`);

    await setCached(cacheKey, JSON.stringify(allChapters), 60 * 60); // 1 hour

    return NextResponse.json(
      { chapters: allChapters },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200",
          "X-Cache": "MISS",
        },
      }
    );
  } catch (error) {
    console.error("[Chapters List] Unexpected error:", error);
    return NextResponse.json(
      {
        chapters: [],
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}