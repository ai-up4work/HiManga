"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Manga } from "@/lib/mock-data";
import { Star, BookOpen, Eye, Bell, BellOff, PlayCircle } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { BookmarkButton } from "@/components/bookmark-button";
import { RatingComponent } from "@/components/rating-component";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useNotifications } from "@/lib/notifications-context";
import { useAuth } from "@/lib/auth-context";
import { useBookmarks } from "@/hooks/use-bookmarks";
import Image from "next/image";

interface MangaDetailsHeroProps {
  manga: Manga;
}

export function MangaDetailsHero({ manga }: MangaDetailsHeroProps) {
  const { subscribeManga, unsubscribeManga, isSubscribed } = useNotifications();
  const { user } = useAuth();
  const { getBookmark, isLoaded: bookmarksLoaded } = useBookmarks(
    user?.id || null
  );
  const [isSubscribedLocal, setIsSubscribedLocal] = useState(
    isSubscribed(manga.id)
  );
  const [bookmark, setBookmark] = useState<any>(null);

  useEffect(() => {
    if (bookmarksLoaded && user) {
      const userBookmark = getBookmark(manga.id);
      setBookmark(userBookmark);
    }
  }, [bookmarksLoaded, manga.id, getBookmark, user]);

  const handleSubscribe = () => {
    if (isSubscribedLocal) {
      unsubscribeManga(manga.id);
      setIsSubscribedLocal(false);
    } else {
      subscribeManga(manga.id);
      setIsSubscribedLocal(true);
    }
  };

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
              {/* Rating - No Card */}
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
                    <p className="text-2xl font-black text-white leading-none">
                      {manga.rating}
                    </p>
                    <p className="text-xs text-white/50 font-semibold">
                      Rating
                    </p>
                  </div>
                </div>
              </div>
              {/* Divider */}
              <div className="hidden sm:block w-px h-12 bg-white/10" />
              {/* Chapters */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white leading-none">
                    {manga.chapters}
                  </p>
                  <p className="text-xs text-white/50 font-semibold">
                    Chapters
                  </p>
                </div>
              </div>
              {/* Divider */}
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
              <p className="text-sm text-white/60 mb-3 font-bold">
                Description
              </p>
              <p className="text-sm md:text-base leading-relaxed text-white/80 font-medium">
                {manga.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary Action - Grid Layout */}
              <div
                className={`grid gap-3 ${
                  bookmark ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {/* Continue Reading Button - Only show if bookmark exists */}
                {bookmark && (
                  <Link
                    href={`/manga/${manga.id}/chapter/${bookmark.chapter_number}?page=${bookmark.page_number}`}
                    className="block"
                  >
                    <Button
                      size="lg"
                      className="w-full gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] transition-all duration-300 font-bold rounded-xl"
                    >
                      <PlayCircle className="w-5 h-5" />
                      <span className="hidden sm:inline">Continue Reading</span>
                      <span className="sm:hidden">Continue</span>
                      <span className="text-xs font-normal opacity-80 hidden sm:inline">
                        (Ch. {bookmark.chapter_number}, Panel.{" "}
                        {bookmark.page_number})
                      </span>
                    </Button>
                  </Link>
                )}

                {/* Start Reading Button */}
                <Link href={`/manga/${manga.id}/chapter/1`} className="block">
                  <Button
                    size="lg"
                    className="w-full gap-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] transition-all duration-300 font-bold rounded-xl"
                  >
                    <BookOpen className="w-5 h-5" />
                    {bookmark ? (
                      <>
                        <span className="hidden sm:inline">
                          Start from Beginning
                        </span>
                        <span className="sm:hidden">Start Over</span>
                      </>
                    ) : (
                      "Start Reading"
                    )}
                  </Button>
                </Link>
              </div>

              {/* Secondary Actions - Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FavoriteButton mangaId={manga.id} size="lg" showText />
                <BookmarkButton mangaId={manga.id} size="lg" showText />
                {user && (
                  <Button
                    size="lg"
                    onClick={handleSubscribe}
                    className={`gap-2 font-bold rounded-xl transition-all duration-300 col-span-2 sm:col-span-1 ${
                      isSubscribedLocal
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                        : "bg-white/10 border border-white/20 text-white/80 hover:bg-white/15 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/20"
                    }`}
                  >
                    {isSubscribedLocal ? (
                      <>
                        <Bell className="w-5 h-5" />
                        <span className="hidden sm:inline">Subscribed</span>
                        <span className="sm:hidden">Notify</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-5 h-5" />
                        <span className="hidden sm:inline">Subscribe</span>
                        <span className="sm:hidden">Notify</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
