"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Lock,
  ChevronRight,
  Search,
  ArrowUpDown,
  X,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface Chapter {
  id: string;
  chapter_number: number;
  title: string | null;
  total_panels: number;
  published_at: string;
  created_at: string;
}

interface ChaptersSidebarProps {
  mangaId: string;
  currentChapter?: number;
  chapters: number;
  userId?: string;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ChaptersSidebarSkeleton() {
  return (
    <>
      <div className="flex-shrink-0 z-20 p-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900/95 to-slate-900/90 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-slate-700/60 rounded-full animate-pulse" />
          <div className="h-4 w-16 bg-slate-700/60 rounded-full animate-pulse" />
        </div>
        <div className="mt-3 h-8 bg-slate-800/50 border border-slate-700/50 rounded-lg animate-pulse" />
        <div className="mt-2 h-8 bg-slate-800/50 border border-slate-700/50 rounded-lg animate-pulse" />
      </div>
      <div className="flex-1 overflow-hidden p-3 space-y-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="p-3 rounded-lg border border-slate-700/50 bg-slate-800/30 flex items-center justify-between animate-pulse"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-3.5 bg-slate-700/60 rounded-full w-2/3" />
              <div className="h-3 bg-slate-700/40 rounded-full w-1/3" />
            </div>
            <div className="h-4 w-4 bg-slate-700/40 rounded" />
          </div>
        ))}
      </div>
    </>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────

function formatChapterForUrl(num: number): string {
  if (Number.isInteger(num)) return String(num);
  return String(parseFloat(num.toFixed(2))).replace(".", "-");
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChaptersSidebar({
  mangaId,
  currentChapter = 1,
  chapters: totalChapters,
  userId,
}: ChaptersSidebarProps) {
  const BATCH = 50;

  const [displayedChapters, setDisplayedChapters] = useState(BATCH);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [rawChapters, setRawChapters] = useState<Chapter[]>([]);
  const [readChapters, setReadChapters] = useState<number[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [maxAvailableChapter, setMaxAvailableChapter] = useState(0);

  const filteredLengthRef = useRef(0);
  const isLoadingMoreRef = useRef(false);

  // ── Fetch chapters (cached — chapter list rarely changes) ─────────────────
  useEffect(() => {
    const fetchChapters = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/manga/chapters?mangaId=${mangaId}`, {
          next: { revalidate: 300 }, // cache for 5 minutes
        });
        const data = await res.json();
        if (data.chapters && data.chapters.length > 0) {
          const sorted = [...data.chapters].sort(
            (a: Chapter, b: Chapter) => a.chapter_number - b.chapter_number
          );
          setRawChapters(sorted);
          setMaxAvailableChapter(sorted[sorted.length - 1].chapter_number);
          setUsingFallback(false);
        } else {
          generateFallbackChapters();
        }
      } catch (err) {
        console.error("Fetch error:", err);
        generateFallbackChapters();
      } finally {
        setIsLoading(false);
      }
    };
    fetchChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mangaId]);

  // ── Fetch read chapters (never cached — must always be fresh) ─────────────
  useEffect(() => {
    const fetchReadChapters = async () => {
      try {
        const res = await fetch(
          `/api/manga/chapters/user-reads?mangaId=${mangaId}`,
          { cache: "no-store" }
        );
        if (!res.ok) { setReadChapters([]); return; }
        const data = await res.json();
        if (data.error) { setReadChapters([]); return; }
        if (data.readChapters && Array.isArray(data.readChapters)) {
          const nums: number[] = data.readChapters
            .map((ch: any) => (typeof ch === "number" ? ch : parseFloat(ch)))
            .filter((ch: number) => !isNaN(ch));
          const deduped = [...new Set(nums)].sort((a, b) => a - b);
          setReadChapters(deduped);
        } else {
          setReadChapters([]);
        }
      } catch (err) {
        console.warn("Could not fetch read chapters:", err);
        setReadChapters([]);
      }
    };

    fetchReadChapters();
  }, [mangaId]);

  const generateFallbackChapters = () => {
    const fallback = Array.from({ length: totalChapters }, (_, i) => ({
      id: `fallback-${i + 1}`,
      chapter_number: i + 1,
      title: `Chapter ${i + 1}`,
      total_panels: 0,
      published_at: new Date(Date.now() - (totalChapters - i) * 86400000).toISOString(),
      created_at: new Date(Date.now() - (totalChapters - i) * 86400000).toISOString(),
    }));
    setRawChapters(fallback);
    setMaxAvailableChapter(totalChapters);
    setUsingFallback(true);
  };

  // ── Derived lists ─────────────────────────────────────────────────────────
  const sortedChapters =
    sortOrder === "desc" ? [...rawChapters].reverse() : rawChapters;

  const filteredChapters = searchQuery
    ? sortedChapters.filter(
        (ch) =>
          ch.chapter_number.toString().includes(searchQuery) ||
          ch.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedChapters;

  filteredLengthRef.current = filteredChapters.length;

  const chaptersList = filteredChapters.slice(0, displayedChapters);
  const hasMore = displayedChapters < filteredChapters.length;

  // ── Infinite scroll ───────────────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (isLoadingMoreRef.current) return;
    if (filteredLengthRef.current === 0) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayedChapters((prev) => prev + 25);
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }, 200);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { root: container, rootMargin: "0px 0px 200px 0px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMore, isLoading]);

  useEffect(() => {
    setDisplayedChapters(BATCH);
    isLoadingMoreRef.current = false;
    setIsLoadingMore(false);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [searchQuery, sortOrder]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggleSortOrder = () =>
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));

  const clearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.blur();
  };

  const isChapterLocked = (chapterNumber: number) => {
    if (usingFallback) return chapterNumber > totalChapters;
    return !rawChapters.some(
      (ch) => ch.chapter_number === chapterNumber && ch.total_panels > 0
    );
  };

  const isChapterRead = (n: number) => readChapters.includes(n);

  return (
    <div
      className="w-full flex flex-col bg-gradient-to-b from-slate-900/40 via-slate-900/20 to-transparent backdrop-blur-xl h-dvh lg:h-full lg:relative lg:border-l lg:border-slate-700/50"
      style={{ maxHeight: "100dvh", position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {isLoading ? (
        <ChaptersSidebarSkeleton />
      ) : (
        <>
          {/* Header */}
          <div className="flex-shrink-0 z-20 p-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900/95 to-slate-900/90 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                {maxAvailableChapter > 0 ? maxAvailableChapter : totalChapters} Chapters
              </h2>
              {readChapters.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400/80">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{readChapters.length} read</span>
                </div>
              )}
            </div>

            <div className="hidden lg:block mt-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
              <input
                ref={searchInputRef}
                type="search"
                inputMode="numeric"
                placeholder="Search chapter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-xs bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:bg-slate-800/70 transition-all"
                style={{ fontSize: "16px" }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  type="button"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={toggleSortOrder}
              type="button"
              className="mt-2 w-full flex items-center justify-between px-3 py-2 text-xs bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 hover:bg-slate-800/70 hover:border-cyan-400/50 transition-all active:scale-[0.98]"
            >
              <span>Sort: {sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400/60" />
            </button>

            {searchQuery && (
              <p className="text-xs text-slate-400 mt-2">
                Found {filteredChapters.length} chapter
                {filteredChapters.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Scrollable list */}
          <div
            ref={scrollContainerRef}
            id="chapters-scroll"
            className="flex-1 overflow-y-auto p-3 space-y-2"
          >
            {chaptersList.length > 0 ? (
              chaptersList.map((chapter) => {
                const isRead = isChapterRead(chapter.chapter_number);
                const isLocked = isChapterLocked(chapter.chapter_number);
                const isCurrent =
                  parseFloat(String(currentChapter)) === chapter.chapter_number;

                return (
                  <Link
                    key={chapter.id}
                    href={
                      isLocked
                        ? "#"
                        : `/manga/${mangaId}/chapter/${formatChapterForUrl(chapter.chapter_number)}`
                    }
                    className={isLocked ? "pointer-events-none" : ""}
                  >
                    <div
                      className={`p-3 my-1 rounded-lg transition-all duration-200 group border flex items-center justify-between active:scale-[0.98] relative overflow-hidden ${
                        isCurrent
                          ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400/60 shadow-lg shadow-cyan-500/20"
                          : isRead
                          ? "bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 border-emerald-600/50 hover:from-emerald-900/40 hover:to-emerald-800/30 hover:border-emerald-500/60"
                          : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-cyan-400/40"
                      } ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {isRead && !isCurrent && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                      )}
                      <div className="flex flex-col gap-0.5 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${isRead ? "text-emerald-50" : "text-slate-100"}`}>
                            {chapter.title || `Chapter ${chapter.chapter_number}`}
                          </p>
                          {isRead && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className={`text-xs ${isRead ? "text-emerald-200/60" : "text-slate-400"}`}>
                          {new Date(chapter.published_at).toLocaleDateString()}
                        </p>
                        {isLocked && (
                          <p className="text-xs text-amber-400/70 mt-1">Not released yet</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isLocked ? (
                          <Lock className="w-4 h-4 text-amber-500/70" />
                        ) : (
                          <ChevronRight
                            className={`w-4 h-4 transition-colors ${
                              isRead
                                ? "text-emerald-400/70 group-hover:text-emerald-300"
                                : "text-cyan-400/60 group-hover:text-cyan-400"
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">No chapters found</p>
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="mt-2 text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

            {isLoadingMore && (
              <div className="p-4 text-center">
                <div className="inline-block w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-xs text-slate-400 mt-2">Loading more chapters...</p>
              </div>
            )}

            {hasMore && (
              <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />
            )}
          </div>
        </>
      )}

      <style jsx global>{`
        html, body {
          overflow: hidden;
          height: 100%;
          position: fixed;
          width: 100%;
        }
        #chapters-scroll {
          scrollbar-width: thin;
          scrollbar-color: #475569 transparent;
        }
        #chapters-scroll::-webkit-scrollbar { width: 6px; }
        #chapters-scroll::-webkit-scrollbar-track { background: transparent; }
        #chapters-scroll::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }
        #chapters-scroll::-webkit-scrollbar-thumb:hover { background: #64748b; }
        @supports (-webkit-touch-callout: none) {
          input[type="search"] { font-size: 16px; }
        }
      `}</style>
    </div>
  );
}