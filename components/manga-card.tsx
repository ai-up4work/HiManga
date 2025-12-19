"use client";

import type React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Manga } from "@/lib/mock-data";
import Link from "next/link";
import { Star, BookOpen, Lock } from "lucide-react";
import Image from "next/image";

interface MangaCardProps {
  manga: Manga;
  onGenreClick?: (genre: string) => void;
}

export function MangaCard({ manga, onGenreClick }: MangaCardProps) {
  const handleGenreClick = (e: React.MouseEvent, genre: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onGenreClick) {
      onGenreClick(genre);
    }
  };

  const isLocked = manga.status === "Locked";

  const badgeLabel =
    manga.status === "ongoing"
      ? "Ongoing"
      : manga.status === "completed"
      ? "Completed"
      : "Coming Soon";

  const badgeStyle =
    manga.status === "Locked"
      ? "bg-gray-600/80 text-white"
      : "bg-primary/90 text-white";

  return (
    <div
      className={`${
        isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <Link
        href={isLocked ? "#" : `/manga/${manga.id}`}
        onClick={(e) => {
          if (isLocked) e.preventDefault();
        }}
      >
        <Card
          className={`overflow-hidden h-full flex flex-col bg-white/5 border-white/10 backdrop-blur-sm transition-all duration-300
            ${
              isLocked
                ? "hover:shadow-none"
                : "hover:shadow-lg hover:border-pink-500/40 hover:bg-white/10"
            }`}
        >
          {/* Cover */}
          <div className="relative overflow-hidden bg-muted h-64">
            <Image
              src={manga.cover || "/placeholder.svg"}
              alt={manga.title}
              className={`w-full h-full object-cover transition-transform duration-300 ${
                isLocked ? "" : "hover:scale-105"
              }`}
            />

            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className={badgeStyle}>
                {badgeLabel}
              </Badge>
            </div>

            {isLocked && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-semibold text-lg line-clamp-2 mb-1">
              {manga.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">{manga.author}</p>

            <div className="flex items-center gap-1 mb-3">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="text-sm font-medium">{manga.rating}</span>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {manga.genre.slice(0, 2).map((g) => (
                <button
                  key={g}
                  onClick={(e) => handleGenreClick(e, g)}
                  disabled={isLocked}
                  className={`text-xs px-2 py-1 rounded border transition-all
                    ${
                      isLocked
                        ? "bg-white/5 border-white/10 text-white/50"
                        : "bg-white/10 border-white/20 text-white/70 hover:bg-pink-500/20 hover:border-pink-500/40 hover:text-pink-400 cursor-pointer"
                    }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-auto">
              <BookOpen className="w-3 h-3" />
              <span>{manga.chapters} chapters</span>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
