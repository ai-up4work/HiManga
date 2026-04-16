import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const runtime = "edge";

const BASE_SELECT = `
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
  total_reads,
  created_at,
  manga_genres(
    genres(name)
  )
`;

function mapManga(manga: any, fromRpc = false) {
  const genreNames = fromRpc
    ? (manga.genres ?? []).filter(Boolean)
    : manga.manga_genres?.map((mg: any) => mg.genres?.name).filter(Boolean) ?? [];

  return {
    id: manga.id,
    title: manga.title ?? "Unknown Title",
    slug: manga.slug ?? "",
    author: manga.author ?? "Unknown Author",
    cover: manga.cover_image_url ?? "/placeholder-manga.jpg",
    rating: Number(manga.average_rating) || 0,
    chapters: manga.total_chapters || 0,
    status: manga.status ?? "ongoing",
    genre: genreNames,
    description: manga.description ?? "",
    views: manga.total_views || 0,
    reads: manga.total_reads || 0,
    fame_score: Number(manga.fame_score) || 0,
    created_at: manga.created_at,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0");
  const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "50"), 1), 100);
  const genre = searchParams.get("genre") || null;
  const sortBy = searchParams.get("sortBy") || "fame";
  const search = searchParams.get("search") || null;

  try {
    // --- Fame sort: use RPC with server-side scoring ---
    if (sortBy === "fame") {
      const { data, error } = await supabase.rpc("get_mangas_by_fame", {
        p_page: page,
        p_page_size: pageSize,
        p_search: search,
        p_genre: genre,
      });

      if (error) throw error;

      const total = data?.[0]?.total_count ?? 0;
      const mangas = (data || []).map((m: any) => mapManga(m, true));

      return NextResponse.json(
        { mangas, total, page, pageSize, sortBy },
        { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
      );
    }

    // --- All other sorts: use standard select ---
    let query = supabase
      .from("mangas")
      .select(BASE_SELECT, { count: "exact" })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    switch (sortBy) {
      case "rating":
        query = query.order("average_rating", { ascending: false });
        break;
      case "reads":
        query = query.order("total_reads", { ascending: false });
        break;
      case "views":
        query = query.order("total_views", { ascending: false });
        break;
      case "recent":
        query = query.order("created_at", { ascending: false });
        break;
      default:
        query = query.order("id", { ascending: false });
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
    }

    if (genre) {
      query = query.eq("manga_genres.genres.name", genre);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const mangas = (data || []).map((m: any) => mapManga(m, false));

    return NextResponse.json(
      { mangas, total: count ?? 0, page, pageSize, sortBy },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );

  } catch (err) {
    console.error("Manga API error:", err);
    return NextResponse.json({ error: "Failed to fetch mangas" }, { status: 500 });
  }
}