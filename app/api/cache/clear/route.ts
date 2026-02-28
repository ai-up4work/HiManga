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

    // 1. Delete exact chapters-list key
    const chaptersListKey = `chapters-list:${manga_id}`;
    totalCleared += await redis.del(chaptersListKey);

    // 2. Delete all chapter-info keys for this manga using SCAN
    // Pattern: chapter-info:{manga_id}:* 
    // This only matches chapter-info keys, nothing else
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

    // 3. Re-warm chapters-list cache immediately with fresh data
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (baseUrl) {
      const warmResponse = await fetch(
        `${baseUrl}/api/manga/chapters?mangaId=${manga_id}&skipCache=true`
      );
      const warmData = await warmResponse.json();
      console.log(`[Cache Clear] Re-warmed with ${warmData.chapters?.length ?? 0} chapters`);
    }

    return NextResponse.json({ success: true, cleared: totalCleared });

  } catch (error) {
    console.error("[Cache Clear] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}