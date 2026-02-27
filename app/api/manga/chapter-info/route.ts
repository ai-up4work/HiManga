import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import redis from "@/lib/redis";
import { TTL } from "@/lib/cacheTTL";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mangaId = searchParams.get("manga"); 
  const chapterParam = searchParams.get("chapter");
  const skipCache = searchParams.get("skipCache") === "true";

  if (!mangaId || !chapterParam) {
    return NextResponse.json(
      { error: "Missing required parameters: manga and chapter" },
      { status: 400 }
    );
  }

  const chapterNumber = parseFloat(chapterParam);
  if (isNaN(chapterNumber) || chapterNumber < 1) {
    return NextResponse.json(
      { error: "Invalid chapter number" },
      { status: 400 }
    );
  }

  // ✅ Redis cache check
  const cacheKey = `chapter-info:${mangaId}:${chapterNumber}`;
  if (!skipCache) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[Chapter Info] Cache HIT: manga=${mangaId}, chapter=${chapterNumber}`);
      return NextResponse.json(JSON.parse(cached as string), {
        headers: {
          "Cache-Control": "public, max-age=10800, s-maxage=10800, stale-while-revalidate=86400",
          "X-Cache": "HIT",
        },
      });
    }
  }

  try {
    console.log(`[Chapter Info] Cache MISS: Fetching manga=${mangaId}, chapter=${chapterNumber}`);

    const { data, error } = await supabase
      .from("chapters")
      .select(`
        id,
        manga_id,
        chapter_number,
        title,
        total_panels,
        published_at,
        manga:mangas!inner(
          id,
          slug,
          title
        )
      `)
      .eq("manga_id", mangaId)
      .eq("chapter_number", chapterNumber)
      .single();

    if (error) {
      console.error("[Chapter Info] Database error:", error);
      return NextResponse.json(
        { 
          error: "Chapter not found", 
          details: error.message,
          hint: error.hint || "Check if chapter exists in database"
        },
        { status: 404 }
      );
    }

    if (!data) {
      console.error("[Chapter Info] No data returned");
      return NextResponse.json(
        { error: "Chapter not found in database" },
        { status: 404 }
      );
    }

    if (!data.manga) {
      console.error("[Chapter Info] Manga relation missing:", data.id);
      return NextResponse.json(
        { error: "Invalid chapter data: manga not found" },
        { status: 500 }
      );
    }

    console.log(`[Chapter Info] Success: ${data.total_panels} panels found`);

    const responseData = {
      chapterId: data.id,
      chapterNumber: data.chapter_number,
      chapterTitle: data.title,
      totalPanels: data.total_panels,
      publishedAt: data.published_at,
      manga: {
        id: data.manga.id,
        slug: data.manga.slug,
        title: data.manga.title,
      },
    };

    // ✅ Store in Redis — 1 week since chapter info never changes
    await redis.set(cacheKey, JSON.stringify(responseData), 'EX', TTL.WEEK);

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "public, max-age=10800, s-maxage=10800, stale-while-revalidate=86400",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("[Chapter Info] Unexpected error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch chapter information",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}