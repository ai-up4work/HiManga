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

    const keysToDelete = [
      `chapters-list:${manga_id}`,
      `chapter-info:${manga_id}:${chapter_number}`,
    ];

    await redis.del(...keysToDelete);

    console.log(`[Cache Clear] Cleared: ${keysToDelete.join(", ")}`);
    return NextResponse.json({ success: true, cleared: keysToDelete });

  } catch (error) {
    console.error("[Cache Clear] Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}