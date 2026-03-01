"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useMangas } from "@/hooks/use-mangas";
import { supabase } from "@/lib/supabase";
import { AnimeCard } from "@/components/anime-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, ArrowRight } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

// ── Skeletons ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10 animate-pulse">
      <div className="aspect-[2/3] bg-white/10" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-white/10 rounded-full w-4/5" />
        <div className="h-3 bg-white/10 rounded-full w-2/5" />
      </div>
    </div>
  );
}

function TrendingPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-5 sm:space-y-8">
        <div className="rounded-md bg-white/5 border border-pink-500/20 p-5 sm:p-8 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-5 w-5 sm:h-6 sm:w-6 rounded bg-white/10" />
            <div className="h-7 sm:h-8 w-40 sm:w-52 bg-white/10 rounded-md" />
          </div>
          <div className="h-4 w-56 sm:w-72 bg-white/10 rounded-md" />
        </div>
        <div className="h-11 rounded-md bg-white/5 border border-white/10 animate-pulse" />
        <div className="flex gap-2 overflow-hidden">
          {[10, 20, 16, 24, 14, 20].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded bg-white/10 animate-pulse flex-shrink-0"
              style={{ width: `${w * 4}px`, animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ animationDelay: `${i * 40}ms` }}>
              <SkeletonCard />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ── Sort options ───────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: "rating" | "views" | "recent"; label: string }[] = [
  { value: "rating", label: "Top Rated" },
  { value: "views", label: "Most Viewed" },
  { value: "recent", label: "Recent" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrendingPage() {
  const [mangaIds, setMangaIds] = useState<string[]>([]);
  const [isLoadingIds, setIsLoadingIds] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "views" | "recent">("rating");
  const [itemsPerPage] = useState(10);
  const [displayedItems, setDisplayedItems] = useState(itemsPerPage);

  useEffect(() => {
    async function fetchMangaIds() {
      try {
        const { data, error } = await supabase
          .from("mangas")
          .select("id")
          .order("average_rating", { ascending: false });
        if (error) throw error;
        setMangaIds(data?.map((m) => m.id) || []);
      } catch (error) {
        console.error("Error fetching manga IDs:", error);
      } finally {
        setIsLoadingIds(false);
      }
    }
    fetchMangaIds();
  }, []);

  const { favoriteMangas: allMangas, isLoading: mangasLoading } = useMangas(
    "system",
    mangaIds,
    []
  );

  const isLoading = isLoadingIds || mangasLoading;

  const genres = useMemo(() => {
    const allGenres = new Set<string>();
    allMangas.forEach((manga) => manga.genre?.forEach((g) => allGenres.add(g)));
    return ["All", ...Array.from(allGenres).sort()];
  }, [allMangas]);

  const filteredMangas = useMemo(() => {
    let result = allMangas;
    if (selectedGenre && selectedGenre !== "All")
      result = result.filter((m) => m.genre?.includes(selectedGenre));
    if (searchQuery)
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    if (sortBy === "rating") result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sortBy === "views")
      result = [...result].sort((a, b) => (b.views || 0) - (a.views || 0));
    return result;
  }, [allMangas, selectedGenre, searchQuery, sortBy]);

  const displayedMangas = filteredMangas.slice(0, displayedItems);
  const hasMore = displayedItems < filteredMangas.length;

  const handleLoadMore = () => setDisplayedItems((prev) => prev + itemsPerPage);
  const handleGenreClick = (genre: string) => {
    setSelectedGenre(genre === "All" ? null : genre);
    setDisplayedItems(itemsPerPage);
  };
  const clearFilters = () => {
    setSelectedGenre(null);
    setSearchQuery("");
    setDisplayedItems(itemsPerPage);
  };

  if (isLoading) return <TrendingPageSkeleton />;

  const activeGenre = selectedGenre ?? "All";

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-5 sm:space-y-8">

        {/* ── Banner ───────────────────────────────────────────────────── */}
        <div className="rounded-md bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 backdrop-blur-sm px-5 sm:px-8 py-5 sm:py-7">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5 sm:mb-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500 flex-shrink-0" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-none tracking-tight">
              Trending Manga
            </h1>
          </div>
          <p className="text-white/60 text-sm sm:text-base pl-0.5">
            Discover the most popular manga this season
          </p>
        </div>

        {/* ── Search ───────────────────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <Input
            placeholder="Search by title or author…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-white/10 backdrop-blur-sm border-white/10 focus-visible:border-pink-500/50 focus-visible:ring-0 rounded-md text-white placeholder:text-white/40"
          />
        </div>

        {/* ── Filters Row ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {/* Genre pills — horizontally scrollable, hidden scrollbar */}
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`.genre-scroll::-webkit-scrollbar { display: none; }`}</style>
            {genres.map((genre) => {
              const isActive = genre === activeGenre;
              return (
                <button
                  key={genre}
                  onClick={() => handleGenreClick(genre)}
                  className={[
                    "px-3 py-1.5 rounded text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 backdrop-blur-sm",
                    isActive
                      ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-white shadow-lg shadow-pink-500/10"
                      : "bg-white/10 border border-transparent text-white/70 hover:bg-white/15 hover:text-white",
                  ].join(" ")}
                >
                  {genre}
                </button>
              );
            })}
          </div>

          {/* Sort — full width on mobile, auto on sm+ */}
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs font-medium flex-shrink-0">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "rating" | "views" | "recent")}
              className="appearance-none w-full sm:w-auto px-4 py-1.5 rounded text-sm font-bold bg-white/10 backdrop-blur-sm border border-transparent text-white/70 hover:bg-white/15 hover:text-white focus:outline-none focus:border-pink-500/30 transition-all cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-[#0a0a1a]">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Results count ─────────────────────────────────────────────── */}
        <p className="text-xs text-white/40 -mt-2">
          Showing{" "}
          <span className="text-white/70 font-medium">{displayedMangas.length}</span>
          {" "}of{" "}
          <span className="text-white/70 font-medium">{filteredMangas.length}</span>
          {" "}manga
        </p>

        {/* ── Grid ──────────────────────────────────────────────────────── */}
        {displayedMangas.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {displayedMangas.map((manga) => (
                <AnimeCard key={manga.id} manga={manga} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={handleLoadMore}
                  className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold px-8 py-6 text-base rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-xl hover:shadow-pink-500/50 hover:scale-105"
                >
                  Load More Manga
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center gap-5">
            <p className="text-white/50 text-sm sm:text-base">
              No manga found matching your criteria.
            </p>
            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full sm:w-auto border-2 border-white/40 text-white hover:text-pink-500/80 font-bold px-8 py-6 text-base rounded-full transition-all bg-white/5 backdrop-blur-sm hover:border-white/60"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}