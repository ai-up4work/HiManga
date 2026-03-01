// ========== TRENDING SECTION COMPONENT ==========
"use client";

import { supabase } from "@/lib/supabase";
import { AnimeCard } from "./anime-card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useMangas } from "@/hooks/use-mangas";
import Link from "next/link";

// Skeleton card matching AnimeCard dimensions
function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10 animate-pulse">
      {/* Poster image area */}
      <div className="aspect-[2/3] bg-white/10" />
      {/* Text area */}
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-white/10 rounded-full w-4/5" />
        <div className="h-3 bg-white/10 rounded-full w-2/5" />
      </div>
    </div>
  );
}

// Skeleton genre pills
function SkeletonGenres() {
  const widths = ["w-16", "w-20", "w-14", "w-24", "w-18", "w-16", "w-20", "w-14"];
  return (
    <div className="hidden md:flex gap-3 pb-2">
      {widths.map((w, i) => (
        <div
          key={i}
          className={`h-9 ${w} rounded-full bg-white/10 animate-pulse`}
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}

export function TrendingSection() {
  const [mangaIds, setMangaIds] = useState<string[]>([]);
  const [isLoadingIds, setIsLoadingIds] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    async function fetchMangaIds() {
      try {
        const { data, error } = await supabase
          .from("mangas")
          .select("id")
          .order("average_rating", { ascending: false })
          .limit(50);

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
    return selectedGenre
      ? allMangas.filter((manga) => manga.genre?.includes(selectedGenre))
      : allMangas;
  }, [allMangas, selectedGenre]);

  const visibleMangas = filteredMangas.slice(0, visibleCount);

  const handleLoadMore = () => setVisibleCount((prev) => prev + 10);

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre === "All" ? null : genre);
    setVisibleCount(10);
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-[#0a0a1a] to-[#0f0f1f] relative">
      <div className="w-full px-4 md:px-10 lg:px-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-black mb-2 text-white">
              Trending Now
            </h2>
            <p className="text-white/60 text-lg">
              Most popular manga this season
            </p>
          </div>
        </div>

        {/* Genre Filter */}
        <div className="mb-12 relative">
          {isLoading ? (
            <>
              {/* Mobile skeleton */}
              <div className="md:hidden h-12 rounded-xl bg-white/10 animate-pulse" />
              {/* Desktop skeleton */}
              <SkeletonGenres />
            </>
          ) : (
            <>
              {/* Mobile Dropdown */}
              <div className="md:hidden">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold backdrop-blur-sm"
                >
                  <span>{selectedGenre === null ? "All Genres" : selectedGenre}</span>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${showFilterMenu ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {/* Desktop Horizontal Scroll */}
              <div className="hidden md:flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => handleGenreSelect(genre)}
                    className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                      (genre === "All" && selectedGenre === null) || selectedGenre === genre
                        ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30"
                        : "bg-white/10 border border-white/20 text-white/70 hover:bg-white/15 hover:text-white backdrop-blur-sm"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Results Count */}
        {!isLoading && selectedGenre && (
          <p className="text-white/60 mb-6">
            Showing {filteredMangas.length} result{filteredMangas.length !== 1 ? "s" : ""} for {selectedGenre}
          </p>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 mb-12">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ animationDelay: `${i * 40}ms` }}>
                <SkeletonCard />
              </div>
            ))}
          </div>
        ) : visibleMangas.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 mb-12">
              {visibleMangas.map((manga) => (
                <AnimeCard key={manga.id} manga={manga} />
              ))}
            </div>

            {visibleCount < filteredMangas.length && (
              <div className="flex justify-center">
                <Link href="/trending">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 bg-transparent border-pink-500/40 hover:text-pink-500/50 text-pink-500 rounded-full font-bold px-8"
                  >
                    View All Manga
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            )}

            {visibleCount >= filteredMangas.length && (
              <div className="text-center">
                <p className="text-white/60">You've reached the end! All manga loaded.</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/60 text-lg">
              No manga found in this genre. Try selecting a different filter.
            </p>
          </div>
        )}
      </div>

      {/* Mobile Overlay Dropdown */}
      {showFilterMenu && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setShowFilterMenu(false)}
          />
          <div className="md:hidden fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 bg-[#0f0f1f]/95 border border-pink-500/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl shadow-pink-500/20 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Select Genre</h3>
              <button
                onClick={() => setShowFilterMenu(false)}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
            <div className="p-2">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => { handleGenreSelect(genre); setShowFilterMenu(false); }}
                  className={`w-full px-5 py-3.5 text-left font-bold transition-all rounded-xl mb-1 ${
                    (genre === "All" && selectedGenre === null) || selectedGenre === genre
                      ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}