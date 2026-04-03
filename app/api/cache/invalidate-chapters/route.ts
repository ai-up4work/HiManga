// app/api/cache/invalidate-chapters/route.ts
import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function POST(req: NextRequest) {
  // Verify the request is from Supabase
  const secret = req.headers.get("x-cache-secret");
  if (secret !== process.env.CACHE_INVALIDATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mangaId } = await req.json();
  if (!mangaId) {
    return NextResponse.json({ error: "mangaId required" }, { status: 400 });
  }

  try {
    const key = `chapters-list:${mangaId}`;
    await redis.del(key);
    console.log(`[Cache] Invalidated: ${key}`);
    return NextResponse.json({ success: true, key });
  } catch (err) {
    console.error("[Cache] Invalidation failed:", err);
    return NextResponse.json({ error: "Redis error" }, { status: 500 });
  }
}