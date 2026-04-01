// ==============================================
// FILE: app/api/manga/image/route.ts
// FIXED: Returns 301 redirect instead of proxying image bytes.
// Vercel origin only handles a tiny URL lookup — no image bytes flow through.
// Cloudflare caches the final image directly at the edge.
// ==============================================
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// REMOVED: serverCache (was buffering full image bytes — the main cause of
// Fast Origin Transfer. Images are now cached by Cloudflare directly.)

// URL-only cache: stores the resolved image URL per panel (tiny strings, not buffers)
// This survives warm instances and avoids repeated Supabase lookups.
// For multi-instance production, replace with Vercel KV / Upstash Redis.
const urlCache = new Map<string, {
  url: string;
  timestamp: number;
}>();

const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCacheKey(mangaSlug: string, chapter: number, panel: number): string {
  return `${mangaSlug}_${chapter}_${panel}`;
}

function isCacheExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_EXPIRY_MS;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mangaSlug = searchParams.get("manga");
  const chapter = searchParams.get("chapter");
  const panel = searchParams.get("panel");

  if (!mangaSlug || !chapter || !panel) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const chapterNum = parseFloat(chapter);
  const panelNum = parseInt(panel);

  if (isNaN(chapterNum) || isNaN(panelNum) || chapterNum < 1 || panelNum < 1) {
    return NextResponse.json(
      { error: "Invalid chapter or panel number" },
      { status: 400 }
    );
  }

  const cacheKey = getCacheKey(mangaSlug, chapterNum, panelNum);

  // Check in-memory URL cache first (avoids Supabase round-trip on warm instances)
  let imageUrl: string | undefined;
  const cachedUrl = urlCache.get(cacheKey);

  if (cachedUrl && !isCacheExpired(cachedUrl.timestamp)) {
    console.log(`[Manga Image] URL Cache HIT: ${mangaSlug} ch${chapterNum} p${panelNum}`);
    imageUrl = cachedUrl.url;
  } else {
    console.log(`[Manga Image] URL Cache MISS: Querying Supabase for ${mangaSlug} ch${chapterNum} p${panelNum}`);

    const { data, error } = await supabase
      .from("panels")
      .select(
        `
        image_url,
        chapter:chapters!inner(
          chapter_number,
          manga:mangas!inner(
            slug
          )
        )
      `
      )
      .eq("chapter.manga.slug", mangaSlug)
      .eq("chapter.chapter_number", chapterNum)
      .eq("panel_number", panelNum)
      .single();

    if (error || !data) {
      console.error("Database query error:", error);
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    imageUrl = data.image_url;

    // Cache only the URL string — negligible memory, survives warm instances
    urlCache.set(cacheKey, { url: imageUrl, timestamp: Date.now() });

    // Periodically clean expired URL cache entries (1% chance per request)
    if (Math.random() < 0.01) {
      for (const [key, value] of urlCache.entries()) {
        if (isCacheExpired(value.timestamp)) {
          urlCache.delete(key);
        }
      }
    }
  }

  // KEY FIX: Return a 301 redirect to the real image URL.
  //
  // What this means:
  //   - Vercel origin only processes a tiny URL string lookup (no image bytes)
  //   - The browser/Cloudflare fetches the image directly from the source CDN
  //   - Cloudflare caches the final image at the edge after the first request
  //   - All subsequent requests for the same panel are served by Cloudflare — zero origin transfer
  //
  // Cache-Control on the redirect itself tells Cloudflare to cache the redirect too,
  // so even the 301 response is served from edge after the first hit.
  return NextResponse.redirect(imageUrl, {
    status: 301,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}