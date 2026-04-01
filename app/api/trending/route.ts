import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const genre = searchParams.get("genre") || null;
  const sortBy = searchParams.get("sortBy") || "rating";
  const search = searchParams.get("search") || null;

  try {
    let query = supabase
      .from("mangas")
      .select(
        `
        id,
        title,
        slug,
        author,
        cover_image_url,
        average_rating,
        total_chapters,
        status,
        description,
        total_views,
        created_at,
        manga_genres(
          genres(name)
        )
      `,
        { count: "exact" }
      )
      .range(page * pageSize, (page + 1) * pageSize - 1);

    // Sort
    if (sortBy === "rating") {
      query = query.order("average_rating", { ascending: false });
    } else if (sortBy === "views") {
      query = query.order("total_views", { ascending: false });
    } else if (sortBy === "recent") {
      query = query.order("created_at", { ascending: false });
    }

    // Search
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,author.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform to match Manga type
    const mangas = (data || []).map((manga) => {
      const genreNames: string[] =
        manga.manga_genres
          ?.map((mg: any) => mg.genres?.name)
          .filter(Boolean) || [];

      // Filter by genre if specified (post-query filter since Supabase
      // join filtering is complex — for large DBs move this to a DB function)
      return {
        id: manga.id,
        title: manga.title || "Unknown Title",
        slug: manga.slug || "",
        author: manga.author || "Unknown Author",
        cover: manga.cover_image_url || "/placeholder-manga.jpg",
        rating: Number(manga.average_rating) || 0,
        chapters: manga.total_chapters || 0,
        status: manga.status || "ongoing",
        genre: genreNames,
        description: manga.description || "",
        views: manga.total_views || 0,
      };
    });

    // Genre filter (client-side on the fetched page)
    const filtered = genre
      ? mangas.filter((m) => m.genre.includes(genre))
      : mangas;

    return NextResponse.json(
      { mangas: filtered, total: count ?? 0, page, pageSize },
      {
        headers: {
          // Cloudflare will cache this at the edge for 1 hour
          // and serve stale for up to 1 day while revalidating
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (err) {
    console.error("Trending API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch trending manga" },
      { status: 500 }
    );
  }
}