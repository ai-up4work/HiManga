// app/api/manga/chapters/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import redis from "@/lib/redis";
import { TTL } from "@/lib/cacheTTL";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mangaId = searchParams.get("mangaId");
  const skipCache = searchParams.get("skipCache") === "true";

  if (!mangaId) {
    return NextResponse.json({ chapters: [] }, { status: 400 });
  }

  // ✅ Redis cache check
  const cacheKey = `chapters-list:${mangaId}`;
  if (!skipCache) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const chapters = JSON.parse(cached as string);
      console.log(`[Chapters List] Cache HIT: manga=${mangaId}, ${chapters.length} chapters`);
      return NextResponse.json(
        { chapters },
        {
          headers: {
            "Cache-Control": "public, max-age=10800, s-maxage=10800, stale-while-revalidate=86400",
            "X-Cache": "HIT",
          },
        }
      );
    }
  }

  console.log(`[Chapters List] Cache MISS: Fetching chapters for manga=${mangaId}`);

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

    console.log(`[Chapters List] Success: Fetched ${allChapters.length} chapters for manga=${mangaId}`);

    // ✅ Store in Redis — 1 day since chapter lists rarely change
    await redis.set(cacheKey, JSON.stringify(allChapters), 'EX', TTL.DAY);

    return NextResponse.json(
      { chapters: allChapters },
      {
        headers: {
          "Cache-Control": "public, max-age=10800, s-maxage=10800, stale-while-revalidate=86400",
          "X-Cache": "MISS",
        },
      }
    );
  } catch (error) {
    console.error("[Chapters List] Unexpected error:", error);
    return NextResponse.json(
      { 
        chapters: [], 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}