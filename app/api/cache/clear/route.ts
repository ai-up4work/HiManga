// app/api/cache/clear/route.ts
import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-secret-key");
  if (auth !== process.env.CACHE_CLEAR_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { manga_id, chapter_number } = await req.json();

    // Step 1 — delete all related Redis keys
    const patterns = [
      `chapters-list:${manga_id}`,
      `chapter-info:${manga_id}:*`,
    ];

    let totalCleared = 0;

    for (const pattern of patterns) {
      if (pattern.includes("*")) {
        let cursor = 0;
        do {
          const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
          cursor = Number(nextCursor);
          if (keys.length > 0) {
            await redis.del(...keys);
            totalCleared += keys.length;
          }
        } while (cursor !== 0);
      } else {
        const deleted = await redis.del(pattern);
        totalCleared += deleted;
      }
    }

    console.log(`[Cache Clear] Cleared ${totalCleared} keys for manga=${manga_id}`);

    // Step 2 — immediately re-warm the cache with fresh data
    // This prevents the race condition where a user request
    // refills the cache before the new chapter is visible
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yoursite.com";
    const warmUrl = `${baseUrl}/api/manga/chapters?mangaId=${manga_id}&skipCache=true`;

    const warmResponse = await fetch(warmUrl);
    const warmData = await warmResponse.json();

    console.log(`[Cache Clear] Re-warmed cache with ${warmData.chapters?.length ?? 0} chapters`);

    return NextResponse.json({ 
      success: true, 
      cleared: totalCleared,
      rewarmed: warmData.chapters?.length ?? 0
    });

  } catch (error) {
    console.error("[Cache Clear] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}