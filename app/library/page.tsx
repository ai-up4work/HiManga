"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useFavorites } from "@/hooks/use-favorites";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useMangas } from "@/hooks/use-mangas";
import { useAuth } from "@/lib/auth-context";
import { FavoritedCard } from "@/components/favorited-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Star, Trash2, Search, ArrowRight, AlertCircle, BookMarked } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { RatingComponent } from "@/components/rating-component";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ── Skeletons ─────────────────────────────────────────────────────────────────

function SkeletonFavoriteCard() {
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

function SkeletonBookmarkCard() {
  return (
    <div className="p-3 sm:p-4 rounded-md bg-white/5 border border-white/10 animate-pulse">
      <div className="flex gap-3 sm:gap-4">
        <div className="w-20 h-28 sm:w-24 sm:h-32 rounded bg-white/10 flex-shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-white/10 rounded-full w-3/4" />
          <div className="h-3 bg-white/10 rounded-full w-1/3" />
          <div className="flex gap-2 pt-1">
            <div className="h-5 w-10 bg-white/10 rounded-full" />
            <div className="h-5 w-28 bg-white/10 rounded-full" />
          </div>
          <div className="h-px bg-white/10 w-full my-2" />
          <div className="h-7 bg-white/10 rounded w-full" />
        </div>
      </div>
    </div>
  );
}

function LibrarySkeleton({ activeTab }: { activeTab: "favorites" | "bookmarks" }) {
  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-5 sm:space-y-8">
        {/* Banner skeleton */}
        <div className="rounded-md bg-white/5 border border-pink-500/20 p-5 sm:p-8 animate-pulse">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-5 w-5 sm:h-6 sm:w-6 rounded bg-white/10" />
            <div className="h-7 sm:h-8 w-36 sm:w-48 bg-white/10 rounded-md" />
          </div>
          <div className="h-4 w-52 sm:w-64 bg-white/10 rounded-md" />
        </div>
        {/* Search skeleton */}
        <div className="h-11 rounded-md bg-white/5 border border-white/10 animate-pulse" />
        {/* Tabs skeleton */}
        <div className="flex gap-2">
          {[36, 36].map((w, i) => (
            <div key={i} className="h-8 rounded bg-white/10 animate-pulse flex-shrink-0"
              style={{ width: `${w * 4}px`, animationDelay: `${i * 50}ms` }} />
          ))}
        </div>
        {/* Grid skeleton */}
        {activeTab === "favorites" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ animationDelay: `${i * 40}ms` }}>
                <SkeletonFavoriteCard />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ animationDelay: `${i * 50}ms` }}>
                <SkeletonBookmarkCard />
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { favorites, removeFavorite, isLoaded: favLoaded } = useFavorites(user?.id || null);
  const { bookmarks, removeBookmark, isLoaded: bookLoaded } = useBookmarks(user?.id || null);

  const favoriteMangaIds = favorites.map((f) => f.manga_id);
  const bookmarkMangaIds = bookmarks.map((b) => b.manga_id);

  const {
    favoriteMangas,
    bookmarkedMangas,
    isLoading: mangasLoading,
    error: mangasError,
  } = useMangas(user?.id || null, favoriteMangaIds, bookmarkMangaIds);

  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<"favorites" | "bookmarks">("bookmarks");
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage] = useState(12);
  const [displayedItems, setDisplayedItems] = useState(itemsPerPage);

  useEffect(() => { setIsClient(true); }, []);

  const filteredFavorites = useMemo(() => {
    if (!searchQuery) return favoriteMangas;
    return favoriteMangas.filter(
      (m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, favoriteMangas]);

  const filteredBookmarks = useMemo(() => {
    if (!searchQuery) return bookmarkedMangas;
    return bookmarkedMangas.filter(
      (m) =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, bookmarkedMangas]);

  const currentMangas = activeTab === "favorites" ? filteredFavorites : filteredBookmarks;
  const displayedMangas = currentMangas.slice(0, displayedItems);
  const hasMore = displayedItems < currentMangas.length;

  const handleLoadMore = () => setDisplayedItems((prev) => prev + itemsPerPage);
  const handleTabChange = (tab: "favorites" | "bookmarks") => {
    setActiveTab(tab);
    setDisplayedItems(itemsPerPage);
    setSearchQuery("");
  };
  const handleContinueReading = (mangaId: string, chapterNumber: number, panelNumber: number) => {
    router.push(`/manga/${mangaId}/chapter/${chapterNumber}?panel=${panelNumber}`);
  };

  if (!isClient || !favLoaded || !bookLoaded || mangasLoading) {
    return <LibrarySkeleton activeTab={activeTab} />;
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (mangasError) {
    return (
      <div className="min-h-screen bg-[#0a0a1a]">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <div className="rounded-md bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 backdrop-blur-sm px-5 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-black text-white">Error Loading Library</h2>
            </div>
            <p className="text-white/60 mb-5 text-sm sm:text-base">{mangasError}</p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold rounded-full px-8 py-5 hover:shadow-xl hover:shadow-pink-500/50 hover:scale-105 transition-all"
            >
              Retry
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-5 sm:space-y-8">

        {/* ── Banner — identical structure to Trending page ─────────────── */}
        <div className="rounded-md bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 backdrop-blur-sm px-5 sm:px-8 py-5 sm:py-7">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5 sm:mb-2">
            <BookMarked className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500 flex-shrink-0" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-none tracking-tight">
              My Library
            </h1>
          </div>
          <p className="text-white/60 text-sm sm:text-base pl-0.5">
            Manage your favorites and bookmarks
          </p>
        </div>

        {/* ── Search — identical to Trending page ───────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <Input
            placeholder="Search by title or author…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-white/10 backdrop-blur-sm border-white/10 focus-visible:border-pink-500/50 focus-visible:ring-0 rounded-md text-white placeholder:text-white/40"
          />
        </div>

        {/* ── Tabs — same pill style as genre buttons on Trending ────────── */}
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {(["favorites", "bookmarks"] as const).map((tab) => {
            const count = tab === "favorites" ? favorites.length : bookmarks.length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={[
                  "px-3 py-1.5 rounded text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 backdrop-blur-sm capitalize",
                  isActive
                    ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-white shadow-lg shadow-pink-500/10"
                    : "bg-white/10 border border-transparent text-white/70 hover:bg-white/15 hover:text-white",
                ].join(" ")}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        {/* ── Results count — identical to Trending page ────────────────── */}
        {currentMangas.length > 0 && (
          <p className="text-xs text-white/40 -mt-2">
            Showing{" "}
            <span className="text-white/70 font-medium">{displayedMangas.length}</span>
            {" "}of{" "}
            <span className="text-white/70 font-medium">{currentMangas.length}</span>
            {" "}manga
          </p>
        )}

        {/* ── Favorites grid ────────────────────────────────────────────── */}
        {activeTab === "favorites" ? (
          displayedMangas.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {displayedMangas.map((manga) => (
                  <FavoritedCard key={manga.id} manga={manga} onRemove={removeFavorite} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    size="lg"
                    onClick={handleLoadMore}
                    className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold px-8 py-6 text-base rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-xl hover:shadow-pink-500/50 hover:scale-105"
                  >
                    Load More
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center gap-5">
              <p className="text-white/50 text-sm sm:text-base">
                {searchQuery ? "No favorites found matching your search." : "No favorites yet."}
              </p>
              {searchQuery ? (
                <Button
                  onClick={() => setSearchQuery("")}
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-white/40 text-white hover:text-pink-500/80 font-bold px-8 py-6 text-base rounded-full transition-all bg-white/5 backdrop-blur-sm hover:border-white/60"
                >
                  Clear Search
                </Button>
              ) : (
                <Link href="/trending" className="w-full sm:w-auto">
                  <Button className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold px-8 py-6 text-base rounded-full flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-pink-500/50 hover:scale-105 transition-all">
                    Explore Manga
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              )}
            </div>
          )

        /* ── Bookmarks list ───────────────────────────────────────────── */
        ) : displayedMangas.length > 0 ? (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {displayedMangas.map((manga) => {
                const bookmark = bookmarks.find((b) => b.manga_id === manga.id);
                return (
                  <div
                    key={manga.id}
                    className="p-3 sm:p-4 rounded-md bg-white/5 border border-white/10 hover:border-pink-500/30 transition-colors backdrop-blur-sm"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      {/* Cover */}
                      <Link href={`/manga/${manga.id}`} className="flex-shrink-0">
                        <div className="relative w-20 h-28 sm:w-24 sm:h-32 rounded overflow-hidden">
                          <Image
                            src={manga.cover || "/placeholder.svg"}
                            alt={manga.title}
                            width={96}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/manga/${manga.id}`}>
                          <h3 className="font-black text-base sm:text-lg mb-0.5 text-white hover:text-pink-400 transition-colors truncate leading-tight">
                            {manga.title}
                          </h3>
                        </Link>
                        <p className="text-xs sm:text-sm text-white/50 mb-2 truncate">
                          {manga.author}
                        </p>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                            <span className="text-xs sm:text-sm text-white/70 font-bold">{manga.rating}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/10 border border-white/10 text-white/60">
                            Ch.{bookmark?.chapter_number} · P.{bookmark?.page_number}
                          </span>
                        </div>

                        <div className="mb-2.5 pb-2.5 border-b border-white/10">
                          <RatingComponent mangaId={manga.id} />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleContinueReading(
                                manga.id,
                                bookmark?.chapter_number || 1,
                                bookmark?.page_number || 1
                              )
                            }
                            className="flex-1 h-8 sm:h-9 rounded text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 transition-all hover:shadow-lg hover:shadow-pink-500/30"
                          >
                            Continue Reading
                          </button>
                          <button
                            onClick={() => removeBookmark(manga.id)}
                            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded bg-white/10 border border-white/10 text-white/50 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={handleLoadMore}
                  className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold px-8 py-6 text-base rounded-full flex items-center justify-center gap-2 transition-all hover:shadow-xl hover:shadow-pink-500/50 hover:scale-105"
                >
                  Load More
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center gap-5">
            <p className="text-white/50 text-sm sm:text-base">
              {searchQuery ? "No bookmarks found matching your search." : "No bookmarks yet."}
            </p>
            {searchQuery ? (
              <Button
                onClick={() => setSearchQuery("")}
                variant="outline"
                className="w-full sm:w-auto border-2 border-white/40 text-white hover:text-pink-500/80 font-bold px-8 py-6 text-base rounded-full transition-all bg-white/5 backdrop-blur-sm hover:border-white/60"
              >
                Clear Search
              </Button>
            ) : (
              <Link href="/" className="w-full sm:w-auto">
                <Button className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold px-8 py-6 text-base rounded-full flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-pink-500/50 hover:scale-105 transition-all">
                  Start Reading
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}