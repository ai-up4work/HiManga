// app/api/manga/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import redis from "@/lib/redis";
import { TTL } from "@/lib/cacheTTL";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getCacheKey(mangaSlug: string, chapter: number, panel: number): string {
  return `panel-url:${mangaSlug}:${chapter}:${panel}`;
}

async function fetchImageWithRetry(imageUrl: string, retries = 3): Promise<Response> {
  const methods = [
    async () => {
      return fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://mangaread.org/",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "Sec-Fetch-Dest": "image",
          "Sec-Fetch-Mode": "no-cors",
          "Sec-Fetch-Site": "same-origin",
        },
        cache: "force-cache",
      });
    },
    async () => {
      const proxiedUrl = "https://corsproxy.io/?" + encodeURIComponent(imageUrl);
      return fetch(proxiedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        cache: "force-cache",
      });
    },
    async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Referer": "https://mangaread.org/",
          "Accept": "image/*",
        },
        cache: "force-cache",
      });
    },
  ];

  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    for (const method of methods) {
      try {
        const response = await method();
        if (response.ok) return response;
      } catch (error) {
        lastError = error as Error;
        console.error(`Fetch attempt failed:`, error);
      }
    }
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  
  throw lastError || new Error("All fetch attempts failed");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mangaSlug = searchParams.get("manga");
  const chapter = searchParams.get("chapter");
  const panel = searchParams.get("panel");
  const skipCache = searchParams.get("skipCache") === "true";

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

  try {
    let imageUrl: string | undefined;

    if (!skipCache) {
      const cachedUrl = await redis.get(cacheKey);
      if (cachedUrl) {
        imageUrl = cachedUrl as string;
      }
    }

    if (!imageUrl) {
      const { data, error } = await supabase
        .from("panels")
        .select(`
          image_url,
          chapter:chapters!inner(
            chapter_number,
            manga:mangas!inner(
              slug
            )
          )
        `)
        .eq("chapter.manga.slug", mangaSlug)
        .eq("chapter.chapter_number", chapterNum)
        .eq("panel_number", panelNum)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }

      imageUrl = data.image_url;
      await redis.set(cacheKey, imageUrl, 'EX', TTL.WEEK);
    }

    const imageResponse = await fetchImageWithRetry(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(imageBuffer);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,

        // ── Cloudflare will cache this for 7 days ─────────────────────────────
        // public        → cacheable by Cloudflare edge nodes
        // s-maxage      → how long Cloudflare keeps it (7 days)
        // stale-while-revalidate → serve stale while refreshing in background
        // immutable     → URL content never changes, skip revalidation
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400, immutable",

        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Access-Control-Allow-Origin": "*",

        // ── Critical: Vary only on Accept-Encoding ────────────────────────────
        // If Vary includes "Cookie" or "Authorization", Cloudflare treats every
        // user as unique and NEVER serves from cache. Keep this as-is.
        "Vary": "Accept-Encoding",
      },
    });

  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image: " + (error as Error).message },
      { status: 500 }
    );
  }
}