"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Manga } from "@/lib/mock-data";
import { Star, BookOpen, Eye, PlayCircle } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { BookmarkButton } from "@/components/bookmark-button";
import { RatingComponent } from "@/components/rating-component";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useBookmarks } from "@/hooks/use-bookmarks";
import Image from "next/image";

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/EZMgepAXAvA5uVEG9CkPyu";

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20, flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

interface MangaDetailsHeroProps {
  manga: Manga;
}

export function MangaDetailsHero({ manga }: MangaDetailsHeroProps) {
  const { user } = useAuth();
  const { getBookmark, isLoaded: bookmarksLoaded } = useBookmarks(user?.id || null);
  const [bookmark, setBookmark] = useState<any>(null);

  useEffect(() => {
    if (bookmarksLoaded && user) {
      const userBookmark = getBookmark(manga.id);
      setBookmark(userBookmark);
    }
  }, [bookmarksLoaded, manga.id, getBookmark, user]);

  return (
    <section className="py-12 md:py-16 border-b bg-[#0a0a1a]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cover Image */}
          <div className="flex justify-center md:justify-start">
            <div className="relative w-full max-w-xs group">
              <Image
                src={manga.cover || "/placeholder.svg"}
                alt={manga.title}
                width={384}
                height={512}
                className="w-full rounded-lg shadow-lg shadow-pink-500/20 object-cover aspect-[3/4] group-hover:shadow-xl group-hover:shadow-pink-500/40 transition-all duration-300 border border-white/10"
              />
              <div className="absolute top-4 right-4">
                <Badge className="bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30 font-bold border-0">
                  {manga.status === "ongoing" ? "Ongoing" : "Completed"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-black mb-2 text-white">
                {manga.title}
              </h1>
              <p className="text-base md:text-lg text-white/60 font-semibold">
                by {manga.author}
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-6 sm:gap-3">
              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(manga.rating)
                          ? "fill-yellow-500 text-yellow-500"
                          : "fill-yellow-500/20 text-yellow-500/20"
                      } transition-all`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 sm:block">
                  <div className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center sm:hidden">
                    <Star className="w-5 h-5 fill-pink-500 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white leading-none">{manga.rating}</p>
                    <p className="text-xs text-white/50 font-semibold">Rating</p>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-white/10" />
              {/* Chapters */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white leading-none">{manga.chapters}</p>
                  <p className="text-xs text-white/50 font-semibold">Chapters</p>
                </div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-white/10" />
              {/* Views */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white leading-none">
                    {(manga.views / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-white/50 font-semibold">Reads</p>
                </div>
              </div>
            </div>

            {/* Genres */}
            <div>
              <p className="text-sm text-white/60 mb-3 font-bold">Genres</p>
              <div className="flex flex-wrap gap-2">
                {manga.genre.map((g) => (
                  <Badge
                    key={g}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white/80 hover:border-pink-500/40 hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-purple-500/10 transition-all duration-300 font-semibold backdrop-blur-sm"
                  >
                    {g}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Mobile-only Rating Component */}
            <div className="sm:hidden">
              <RatingComponent mangaId={manga.id} />
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-white/60 mb-3 font-bold">Description</p>
              <p className="text-sm md:text-base leading-relaxed text-white/80 font-medium">
                {manga.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary Actions */}
              <div className={`grid gap-3 ${bookmark ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                {bookmark && (
                  <Link href={`/manga/${manga.id}/chapter/${bookmark.chapter_number}?page=${bookmark.page_number}`} className="block">
                    <Button
                      size="lg"
                      className="w-full gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] transition-all duration-300 font-bold rounded-xl"
                    >
                      <PlayCircle className="w-5 h-5" />
                      <span className="hidden sm:inline">Continue Reading</span>
                      <span className="sm:hidden">Continue</span>
                      <span className="text-xs font-normal opacity-80 hidden sm:inline">
                        (Ch. {bookmark.chapter_number}, Panel. {bookmark.page_number})
                      </span>
                    </Button>
                  </Link>
                )}
                <Link href={`/manga/${manga.id}/chapter/1`} className="block">
                  <Button
                    size="lg"
                    className="w-full gap-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] transition-all duration-300 font-bold rounded-xl"
                  >
                    <BookOpen className="w-5 h-5" />
                    {bookmark ? (
                      <>
                        <span className="hidden sm:inline">Start from Beginning</span>
                        <span className="sm:hidden">Start Over</span>
                      </>
                    ) : (
                      "Start Reading"
                    )}
                  </Button>
                </Link>
              </div>

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FavoriteButton mangaId={manga.id} size="lg" showText />
                <BookmarkButton mangaId={manga.id} size="lg" showText />

                {/* WhatsApp alerts button */}
                <a
                  href={WHATSAPP_GROUP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 bg-green-500/15 border border-green-500/40 text-green-400 hover:bg-green-500/25 hover:border-green-400/60 hover:shadow-lg hover:shadow-green-500/20 hover:scale-[1.02] active:scale-95"
                >
                  {WA_ICON}
                  <span className="hidden sm:inline">Get Alerts</span>
                  <span className="sm:hidden">WhatsApp Alerts</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}