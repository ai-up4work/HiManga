"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AnimeCard } from "@/components/anime-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, ArrowRight } from "lucide-react";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { Manga } from "@/lib/mock-data";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrendingResponse {
  mangas: Manga[];
  total: number;
  page: number;
  pageSize: number;
}

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

const PAGE_SIZE = 20;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrendingPage() {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "views" | "recent">("rating");

  // Debounce search
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery]);

  // Build API URL
  const buildUrl = useCallback(
    (p: number) => {
      const params = new URLSearchParams({
        page: String(p),
        pageSize: String(PAGE_SIZE),
        sortBy,
      });
      if (selectedGenre) params.set("genre", selectedGenre);
      if (debouncedSearch) params.set("search", debouncedSearch);
      return `/api/trending?${params.toString()}`;
    },
    [sortBy, selectedGenre, debouncedSearch]
  );

  // Initial / filter fetch — resets list
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setPage(0);

    fetch(buildUrl(0))
      .then((r) => r.json())
      .then((data: TrendingResponse) => {
        if (cancelled) return;
        setMangas(data.mangas);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [buildUrl]);

  // Load more — appends to list
  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const res = await fetch(buildUrl(nextPage));
      const data: TrendingResponse = await res.json();
      setMangas((prev) => [...prev, ...data.mangas]);
      setPage(nextPage);
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, buildUrl]);

  // Derive genres from loaded mangas for the filter pills
  const genres = useMemo(() => {
    const all = new Set<string>();
    mangas.forEach((m) => m.genre?.forEach((g) => all.add(g)));
    return ["All", ...Array.from(all).sort()];
  }, [mangas]);

  const hasMore = mangas.length < total;

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(genre === "All" ? null : genre);
  };

  const clearFilters = () => {
    setSelectedGenre(null);
    setSearchQuery("");
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
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
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
          <span className="text-white/70 font-medium">{mangas.length}</span>
          {" "}of{" "}
          <span className="text-white/70 font-medium">{total}</span>
          {" "}manga
        </p>

        {/* ── Grid ──────────────────────────────────────────────────────── */}
        {mangas.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {mangas.map((manga) => (
                <AnimeCard key={manga.id} manga={manga} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold px-8 py-6 text-base rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-xl hover:shadow-pink-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoadingMore ? "Loading…" : "Load More Manga"}
                  {!isLoadingMore && <ArrowRight className="w-5 h-5" />}
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