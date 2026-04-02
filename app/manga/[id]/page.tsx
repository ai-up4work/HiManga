"use client";

import { use, useState, useRef, useEffect } from "react";
import { useMangas } from "@/hooks/use-mangas";
import { supabase } from "@/lib/supabase";
import { MangaDetailsHero } from "@/components/manga-details-hero";
import { HorizontalMangaCard } from "@/components/horizontal-manga-card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MangaDetailsPageProps {
  params: Promise<{ id: string }>;
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function SkeletonHero() {
  return (
    <div className="animate-pulse">
      <div className="h-[220px] sm:h-[320px] md:h-[420px] bg-white/10 w-full" />
      <div className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-4 bg-[#0a0a1a]">
        <div className="flex gap-4 sm:gap-6">
          <div className="w-24 sm:w-32 md:w-40 h-36 sm:h-48 md:h-56 rounded-xl bg-white/10 flex-shrink-0 -mt-10 sm:-mt-16 md:-mt-20" />
          <div className="flex-1 space-y-3 pt-1 sm:pt-2 min-w-0">
            <div className="h-6 sm:h-8 bg-white/10 rounded-full w-2/3" />
            <div className="h-3 sm:h-4 bg-white/10 rounded-full w-1/3" />
            <div className="flex flex-wrap gap-2 pt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 sm:h-6 w-14 sm:w-16 bg-white/10 rounded-full" />
              ))}
            </div>
            <div className="space-y-2 pt-1 sm:pt-2">
              <div className="h-3 bg-white/10 rounded-full w-full" />
              <div className="h-3 bg-white/10 rounded-full w-5/6" />
              <div className="h-3 bg-white/10 rounded-full w-4/6 hidden sm:block" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonRelatedCard() {
  return (
    <div className="flex-shrink-0 w-[180px] sm:w-[190px] lg:w-[270px] animate-pulse">
      <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
        <div className="aspect-[2/3] bg-white/10" />
        <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
          <div className="h-3 sm:h-3.5 bg-white/10 rounded-full w-4/5" />
          <div className="h-2.5 sm:h-3 bg-white/10 rounded-full w-2/5" />
        </div>
      </div>
    </div>
  );
}

function MangaDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex flex-1">
        <section className="flex-1 min-w-0">
          <SkeletonHero />
          <div className="h-12 sm:h-20 md:h-24 bg-gradient-to-b from-[#0a0a1a] via-[#0f1729] to-slate-900" />
          <div className="bg-slate-900 px-0 py-6 sm:py-8">
            <div className="mx-auto max-w-[1600px]">
              <div className="flex items-center gap-2 mb-4 sm:mb-6 px-4 sm:px-6 lg:px-10">
                <div className="h-4 sm:h-5 w-4 sm:w-5 rounded bg-white/10 animate-pulse" />
                <div className="h-5 sm:h-6 w-32 sm:w-44 bg-white/10 rounded-full animate-pulse" />
              </div>
              <div className="overflow-hidden pl-4 sm:pl-6 lg:pl-10">
                <div className="flex gap-3 sm:gap-4 lg:gap-6 pr-4 sm:pr-6 lg:pr-10">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ animationDelay: `${i * 50}ms` }}>
                      <SkeletonRelatedCard />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MangaDetailsPage({ params }: MangaDetailsPageProps) {
  const { id } = use(params);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [relatedMangaIds, setRelatedMangaIds] = useState<string[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const { favoriteMangas: allMangas, isLoading: mangasLoading } = useMangas(
    "system",
    [id, ...relatedMangaIds],
    []
  );

  const currentManga = allMangas.find((m) => m.id === id);
  const relatedMangas = allMangas.filter((m) => m.id !== id);

  useEffect(() => {
    async function fetchRelatedMangas() {
      if (!currentManga) return;
      setIsLoadingRelated(true);
      try {
        const genres = currentManga.genre;
        if (genres.length === 0) return;

        const { data: genreData, error: genreError } = await supabase
          .from("genres")
          .select("id")
          .in("name", genres);
        if (genreError) throw genreError;

        const genreIds = genreData?.map((g) => g.id) || [];
        if (genreIds.length === 0) return;

        const { data: mangaGenreData, error: mangaGenreError } = await supabase
          .from("manga_genres")
          .select("manga_id")
          .in("genre_id", genreIds)
          .neq("manga_id", id)
          .limit(20);
        if (mangaGenreError) throw mangaGenreError;

        const uniqueMangaIds = Array.from(
          new Set(mangaGenreData?.map((mg) => mg.manga_id) || [])
        ).slice(0, 20);

        setRelatedMangaIds(uniqueMangaIds);
      } catch (error) {
        console.error("Error fetching related mangas:", error);
      } finally {
        setIsLoadingRelated(false);
      }
    }

    if (currentManga && relatedMangaIds.length === 0) {
      fetchRelatedMangas();
    }
  }, [currentManga, id, relatedMangaIds.length]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      // Scroll by ~2 card widths on mobile for better UX
      const cardWidth = window.innerWidth < 640 ? 172 : window.innerWidth < 1024 ? 202 : 282;
      const scrollAmount = cardWidth * 2;
      scrollContainerRef.current.scrollTo({
        left:
          scrollContainerRef.current.scrollLeft +
          (direction === "left" ? -scrollAmount : scrollAmount),
        behavior: "smooth",
      });
    }
  };

  if (mangasLoading || isLoadingRelated) return <MangaDetailsSkeleton />;

  if (!currentManga) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="p-6 sm:p-8 text-center bg-card/50 border-white/10 backdrop-blur-sm w-full max-w-sm">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Manga Not Found</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              The manga you're looking for doesn't exist.
            </p>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex flex-1">
        <section className="flex-1 min-w-0">
          <MangaDetailsHero manga={currentManga} />

          {/* Gradient divider */}
          <div className="h-12 sm:h-20 md:h-24 bg-gradient-to-b from-[#0a0a1a] via-[#0f1729] to-slate-900" />

          <div className="bg-slate-900 px-0 py-6 sm:py-8">
            <div className="mx-auto max-w-[1600px]">

              {/* Section header */}
              <div className="flex items-center gap-2 mb-4 sm:mb-6 px-4 sm:px-6 lg:px-10">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500 flex-shrink-0" />
                <h2 className="text-lg sm:text-2xl font-bold text-white">You May Also Like</h2>
                {relatedMangas.length > 0 && (
                  <span className="text-xs sm:text-sm text-white/60 ml-auto flex-shrink-0">
                    {relatedMangas.length}{" "}
                    {relatedMangas.length === 1 ? "manga" : "mangas"}
                  </span>
                )}
              </div>

              {relatedMangas.length === 0 ? (
                <div className="flex items-center justify-center py-10 sm:py-12 px-4 sm:px-6">
                  <p className="text-white/60 text-sm sm:text-base">No related manga found</p>
                </div>
              ) : (
                <div className="relative group">
                  {/* Left arrow */}
                  {showLeftArrow && !isTouchDevice && (
                    <button
                      onClick={() => scroll("left")}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 flex items-center justify-center shadow-2xl transition-all duration-300 opacity-90 hover:opacity-100 hover:scale-110"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </button>
                  )}

                  {/* Right arrow */}
                  {showRightArrow && !isTouchDevice && (
                    <button
                      onClick={() => scroll("right")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 flex items-center justify-center shadow-2xl transition-all duration-300 opacity-90 hover:opacity-100 hover:scale-110"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </button>
                  )}

                  {/* Scroll container */}
                  <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="overflow-x-auto overflow-y-hidden pb-4 scrollbar-hide pl-4 sm:pl-6 lg:pl-10"
                  >
                    <div className="flex gap-3 sm:gap-4 lg:gap-6 pr-4 sm:pr-6 lg:pr-10">
                      {relatedMangas.map((relatedManga) => (
                        // KEY FIX: w-[180px] on mobile (was 140px), sm: 190px, lg: 270px
                        <div
                          key={relatedManga.id}
                          className="flex-shrink-0 w-[180px] sm:w-[190px] lg:w-[270px]"
                        >
                          <HorizontalMangaCard manga={relatedManga} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fade edges to hint at scrollability */}
                  <div className="pointer-events-none absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-slate-900 to-transparent" />
                  <div className="pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-slate-900 to-transparent" />
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}