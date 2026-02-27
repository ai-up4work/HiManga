// app/api/cache/clear/route.ts
import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await redis.flushdb();
    console.log("[Cache Clear] Entire Redis cache flushed");
    return NextResponse.json({ success: true, message: "Entire cache cleared" });
  } catch (error) {
    console.error("[Cache Clear] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}