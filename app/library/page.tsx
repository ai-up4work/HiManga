"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useFavorites } from "@/hooks/use-favorites";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useMangas } from "@/hooks/use-mangas";
import { useAuth } from "@/lib/auth-context";
import { FavoritedCard } from "@/components/favorited-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Star, Trash2, Search, ArrowRight, AlertCircle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { RatingComponent } from "@/components/rating-component";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ── Skeleton components ───────────────────────────────────────────────────────

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
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse">
      <div className="flex gap-4">
        {/* Cover */}
        <div className="w-24 h-32 rounded bg-white/10 flex-shrink-0" />
        {/* Text block */}
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-white/10 rounded-full w-3/4" />
          <div className="h-3 bg-white/10 rounded-full w-1/3" />
          <div className="flex gap-2 pt-1">
            <div className="h-5 w-10 bg-white/10 rounded-full" />
            <div className="h-5 w-28 bg-white/10 rounded-full" />
          </div>
          <div className="h-px bg-white/10 w-full my-2" />
          <div className="h-7 bg-white/10 rounded-lg w-full" />
        </div>
      </div>
    </div>
  );
}

function LibrarySkeleton({ activeTab }: { activeTab: "favorites" | "bookmarks" }) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Page title */}
        <div className="mb-12 space-y-3">
          <div className="h-12 bg-white/10 rounded-full w-52 animate-pulse" />
          <div className="h-4 bg-white/10 rounded-full w-72 animate-pulse" />
        </div>

        {/* Tabs + search */}
        <div className="mb-8 space-y-6">
          <div className="flex gap-2">
            <div className="h-11 w-36 rounded-full bg-white/10 animate-pulse" />
            <div className="h-11 w-36 rounded-full bg-white/10 animate-pulse" />
          </div>
          <div className="h-12 rounded-lg bg-white/5 border border-white/10 animate-pulse" />
        </div>

        {/* Cards */}
        {activeTab === "favorites" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ animationDelay: `${i * 40}ms` }}>
                <SkeletonFavoriteCard />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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

  // Loading → skeletons (tab-aware so layout matches what will appear)
  if (!isClient || !favLoaded || !bookLoaded || mangasLoading) {
    return <LibrarySkeleton activeTab={activeTab} />;
  }

  // Error
  if (mangasError) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card className="p-8 bg-card/50 border-destructive/30 backdrop-blur-sm max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <h2 className="text-xl font-semibold text-destructive">Error Loading Library</h2>
            </div>
            <p className="text-muted-foreground mb-4">{mangasError}</p>
            <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-primary to-secondary">
              Retry
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            My Library
          </h1>
          <p className="text-muted-foreground text-lg">Manage your favorites and bookmarks</p>
        </div>

        {/* Tabs + Search */}
        <div className="mb-8 space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(["favorites", "bookmarks"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-6 py-3 rounded-full font-medium text-sm whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20"
                    : "bg-white/5 border border-white/10 text-foreground hover:bg-white/10 hover:border-primary/30"
                }`}
              >
                {tab === "favorites" ? `Favorites (${favorites.length})` : `Bookmarks (${bookmarks.length})`}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search manga by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 focus:border-primary/50 h-12"
            />
          </div>
        </div>

        {/* Results count */}
        {currentMangas.length > 0 && (
          <p className="text-sm text-muted-foreground mb-6">
            Showing {displayedMangas.length} of {currentMangas.length} manga
          </p>
        )}

        {/* ── Favorites tab ── */}
        {activeTab === "favorites" ? (
          displayedMangas.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-12">
                {displayedMangas.map((manga) => (
                  <FavoritedCard key={manga.id} manga={manga} onRemove={removeFavorite} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center">
                  <Button size="lg" variant="outline" onClick={handleLoadMore}
                    className="gap-2 bg-transparent border-pink-500/40 hover:text-pink-500/50 text-pink-500 rounded-full font-bold px-8">
                    <span className="hidden sm:inline">Load More Manga</span>
                    <span className="sm:hidden">Load More</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="p-12 text-center bg-card/50 border-white/10 backdrop-blur-sm">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No favorites found matching your search" : "No favorites yet"}
              </p>
              {searchQuery ? (
                <Button onClick={() => setSearchQuery("")} className="bg-gradient-to-r from-primary to-secondary">Clear Search</Button>
              ) : (
                <Link href="/trending">
                  <Button className="bg-gradient-to-r from-primary to-secondary">Explore Manga</Button>
                </Link>
              )}
            </Card>
          )

        /* ── Bookmarks tab ── */
        ) : displayedMangas.length > 0 ? (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-12">
              {displayedMangas.map((manga) => {
                const bookmark = bookmarks.find((b) => b.manga_id === manga.id);
                return (
                  <Card key={manga.id} className="p-4 bg-card/50 border-white/10 hover:border-primary/30 transition-colors backdrop-blur-sm">
                    <div className="flex gap-4">
                      <Link href={`/manga/${manga.id}`} className="flex-shrink-0">
                        <div className="relative w-24 h-32 rounded overflow-hidden">
                          <Image src={manga.cover || "/placeholder.svg"} alt={manga.title} width={96} height={128} className="w-full h-full object-cover" />
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/manga/${manga.id}`}>
                          <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors truncate">{manga.title}</h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-2 truncate">{manga.author}</p>
                        <div className="flex items-center gap-4 mb-4 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-primary text-primary" />
                            <span className="text-sm">{manga.rating}</span>
                          </div>
                          <Badge variant="outline" className="bg-white/5 border-white/10">
                            Chapter {bookmark?.chapter_number} • Panel {bookmark?.page_number}
                          </Badge>
                        </div>
                        <div className="mb-3 pb-3 border-b border-white/10">
                          <RatingComponent mangaId={manga.id} />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-gradient-to-r from-primary to-secondary flex-1"
                            onClick={() => handleContinueReading(manga.id, bookmark?.chapter_number || 1, bookmark?.page_number || 1)}>
                            Continue Reading
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => removeBookmark(manga.id)}
                            className="gap-2 bg-transparent border-white/10 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            {hasMore && (
              <div className="flex justify-center">
                <Button size="lg" variant="outline" onClick={handleLoadMore}
                  className="gap-2 bg-transparent border-pink-500/40 hover:text-pink-500/50 text-pink-500 rounded-full font-bold px-8">
                  <span className="hidden sm:inline">Load More Bookmarks</span>
                  <span className="sm:hidden">Load More</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="p-12 text-center bg-card/50 border-white/10 backdrop-blur-sm">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No bookmarks found matching your search" : "No bookmarks yet"}
            </p>
            {searchQuery ? (
              <Button onClick={() => setSearchQuery("")} className="bg-gradient-to-r from-primary to-secondary">Clear Search</Button>
            ) : (
              <Link href="/"><Button className="bg-gradient-to-r from-primary to-secondary">Start Reading</Button></Link>
            )}
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}