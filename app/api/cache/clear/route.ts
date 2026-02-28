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

    // Get ALL keys related to this manga — no format matching needed
    const patterns = [
      `chapters-list:${manga_id}`,
      `chapter-info:${manga_id}:*`,  // wildcard — clears regardless of number format
      `chapter-info:*:${chapter_number}*`, // catches any format variation of the chapter
    ];

    let totalCleared = 0;

    for (const pattern of patterns) {
      if (pattern.includes("*")) {
        // Use SCAN for wildcard patterns — never use KEYS in production
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
        // Exact key — direct delete
        const deleted = await redis.del(pattern);
        totalCleared += deleted;
      }
    }

    console.log(`[Cache Clear] Cleared ${totalCleared} keys for manga=${manga_id} chapter=${chapter_number}`);
    return NextResponse.json({ success: true, cleared: totalCleared });

  } catch (error) {
    console.error("[Cache Clear] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}