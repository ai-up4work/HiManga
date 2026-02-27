"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Manga {
  id: string;
  title: string;
  chapters: number;
}

interface Chapter {
  id: string;
  chapter_number: number;
  title: string | null;
  total_panels: number;
  published_at: string;
  created_at: string;
}

interface ChaptersListProps {
  manga: Manga;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ChaptersListSkeleton() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 bg-white/10 rounded-full animate-pulse" />
          <div className="h-4 w-44 bg-white/10 rounded-full animate-pulse" />
        </div>
        <div className="h-8 w-28 bg-white/10 rounded-lg animate-pulse" />
      </div>

      {/* Chapter cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2 animate-pulse"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="h-3.5 bg-white/10 rounded-full w-3/4 mx-auto" />
            <div className="h-3 bg-white/10 rounded-full w-1/2 mx-auto" />
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <div className="h-8 w-8 bg-white/10 rounded-lg animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-8 bg-white/10 rounded-lg animate-pulse"
            style={{ animationDelay: `${i * 40}ms` }} />
        ))}
        <div className="h-8 w-8 bg-white/10 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChaptersList({ manga }: ChaptersListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const chaptersPerPage = 12;

  const generateFallbackChapters = () => {
    const fallbackChapters = Array.from({ length: manga.chapters }, (_, i) => ({
      id: `fallback-${i}`,
      chapter_number: manga.chapters - i,
      title: `Chapter ${manga.chapters - i}`,
      total_panels: 0,
      published_at: new Date(Date.now() - i * 86400000).toISOString(),
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
    }));
    setChapters(fallbackChapters);
    setUsingFallback(true);
  };

  useEffect(() => {
    const fetchChapters = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/manga/chapters?mangaId=${manga.id}`);
        if (!response.ok) throw new Error("Failed to fetch chapters");
        const data = await response.json();
        if (data.chapters && data.chapters.length > 0) {
          setChapters(data.chapters);
          setUsingFallback(false);
        } else {
          generateFallbackChapters();
        }
      } catch (err) {
        console.error("Error fetching chapters:", err);
        generateFallbackChapters();
      } finally {
        setIsLoading(false);
      }
    };
    fetchChapters();
  }, [manga.id, manga.chapters]);

  const sortedChapters = [...chapters].sort((a, b) =>
    sortOrder === "newest"
      ? b.chapter_number - a.chapter_number
      : a.chapter_number - b.chapter_number
  );

  const totalPages = Math.ceil(sortedChapters.length / chaptersPerPage);
  const startIndex = (currentPage - 1) * chaptersPerPage;
  const paginatedChapters = sortedChapters.slice(startIndex, startIndex + chaptersPerPage);

  const formatChapterNumber = (num: number) =>
    num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, "");

  const isChapterLocked = (chapterNumber: number) => {
    const maxUnlockedChapter = Math.max(...chapters.map((c) => c.chapter_number));
    return chapterNumber > maxUnlockedChapter || chapterNumber > manga.chapters;
  };

  if (isLoading) return <ChaptersListSkeleton />;

  if (error && !usingFallback) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Chapters</h2>
          <p className="text-sm text-muted-foreground">
            Total: {chapters.length} chapters
            {usingFallback ? (
              <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-500">(Using fallback data)</span>
            ) : (
              <span className="ml-2 text-xs text-green-600 dark:text-green-500">(Loaded from Supabase)</span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
          className="text-xs"
        >
          {sortOrder === "newest" ? "Newest First" : "Oldest First"}
        </Button>
      </div>

      {/* Chapter grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
        {paginatedChapters.map((chapter) => {
          const isLocked = isChapterLocked(chapter.chapter_number);
          return (
            <Link
              key={chapter.id}
              href={isLocked ? "#" : `/manga/${manga.id}/chapter/${chapter.chapter_number}`}
              className={isLocked ? "pointer-events-none" : ""}
            >
              <Card
                className={`p-3 text-center transition-all hover:scale-105 ${
                  isLocked
                    ? "opacity-50 cursor-not-allowed bg-muted/30"
                    : "cursor-pointer hover:bg-primary/10 hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                  <p className="text-xs font-semibold truncate w-full">
                    {chapter.title || `Ch. ${formatChapterNumber(chapter.chapter_number)}`}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {new Date(chapter.published_at).toLocaleDateString()}
                  </p>
                  {chapter.total_panels > 0 && (
                    <p className="text-xs text-muted-foreground/60">{chapter.total_panels} panels</p>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page: number;
              if (totalPages <= 7) page = i + 1;
              else if (currentPage <= 4) page = i + 1;
              else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
              else page = currentPage - 3 + i;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline" size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}