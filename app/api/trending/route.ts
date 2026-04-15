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
  const pageSize = parseInt(searchParams.get("pageSize") || "50");
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
      .order("id", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    // Better default: trending_score RPC (run SQL once)
    if (sortBy === "trending") {
      query = query
        .select(`
          *,
          trending_score:compute_trending_score(average_rating, total_views, created_at)
        `)
        .order("trending_score", { ascending: false });
    } else if (sortBy === "rating") {
      query = query.order("average_rating", { ascending: false });
    } else if (sortBy === "views") {
      query = query.order("total_views", { ascending: false });
    } else if (sortBy === "recent") {
      query = query.order("created_at", { ascending: false });
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
    }

    if (genre) {
      query = query.eq("manga_genres.genres.name", genre);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const mangas = (data || []).map((manga: any) => {
      const genreNames = manga.manga_genres
        ?.map((mg: any) => mg.genres?.name)
        .filter(Boolean) || [];

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
        trending_score: Number(manga.trending_score) || 0,
      };
    });

    return NextResponse.json(
      { mangas, total: count ?? 0, page, pageSize },
      {
        headers: {
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