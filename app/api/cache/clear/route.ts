// app/api/cache/clear/route.ts
import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-secret-key");
  if (auth !== process.env.CACHE_CLEAR_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { manga_id } = await req.json();

    if (!manga_id) {
      return NextResponse.json({ error: "No manga_id" }, { status: 400 });
    }

    let totalCleared = 0;

    // 1. Delete chapters-list:{manga_id}
    totalCleared += await redis.del(`chapters-list:${manga_id}`);

    // 2. Delete chapter-info:{manga_id}:*
    let cursor = 0;
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        `chapter-info:${manga_id}:*`,
        "COUNT",
        100
      );
      cursor = Number(nextCursor);
      if (keys.length > 0) {
        await redis.del(...keys);
        totalCleared += keys.length;
      }
    } while (cursor !== 0);

    console.log(`[Cache Clear] Cleared ${totalCleared} keys for manga=${manga_id}`);

    // 3. Re-warm — hardcode the URL as fallback in case env var missing
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.himanga.fun";
    
    console.log(`[Cache Clear] Re-warming from: ${baseUrl}`);
    
    let rewarmedCount = 0;
    try {
      const warmResponse = await fetch(
        `${baseUrl}/api/manga/chapters?mangaId=${manga_id}&skipCache=true`,
        { cache: "no-store" }
      );
      
      if (!warmResponse.ok) {
        console.error(`[Cache Clear] Re-warm failed: ${warmResponse.status} ${warmResponse.statusText}`);
      } else {
        const warmData = await warmResponse.json();
        rewarmedCount = warmData.chapters?.length ?? 0;
        console.log(`[Cache Clear] Re-warmed with ${rewarmedCount} chapters`);
      }
    } catch (warmError) {
      console.error(`[Cache Clear] Re-warm fetch error:`, warmError);
    }

    return NextResponse.json({ 
      success: true, 
      cleared: totalCleared,
      rewarmed: rewarmedCount,
      baseUrl // log this so we can see what URL was used
    });

  } catch (error) {
    console.error("[Cache Clear] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}