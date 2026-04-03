// app/api/cache/invalidate-chapters/route.ts
import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

function verify(req: NextRequest) {
  const secret =
    req.headers.get("x-cache-secret") ??
    req.nextUrl.searchParams.get("secret");
  return secret === process.env.CACHE_INVALIDATION_SECRET;
}

export async function POST(req: NextRequest) {
  if (!verify(req)) {
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

export async function GET(req: NextRequest) {
  if (!verify(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mangaId = req.nextUrl.searchParams.get("mangaId");
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