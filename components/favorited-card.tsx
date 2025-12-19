"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Manga } from "@/lib/mock-data";
import { Star, Trash2, BookOpen } from "lucide-react";
import Link from "next/link";
import { RatingComponent } from "@/components/rating-component";
import Image from "next/image";

interface FavoritedCardProps {
  manga: Manga;
  onRemove: (mangaId: string) => void;
}

export function FavoritedCard({ manga, onRemove }: FavoritedCardProps) {
  return (
    <Card className="group relative overflow-hidden bg-card/50 border-white/10 hover:border-primary/30 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
      {/* Cover Image */}
      <Link href={`/manga/${manga.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <Image
            src={manga.cover || "/placeholder.svg"}
            alt={manga.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Status Badge */}
          <Badge className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30 font-bold border-0 text-xs">
            {manga.status === "ongoing" ? "Ongoing" : "Completed"}
          </Badge>

          {/* Quick Action on Hover */}
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <Link href={`/manga/${manga.id}/chapter/1`}>
              <Button
                size="sm"
                className="w-full gap-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg font-bold"
              >
                <BookOpen className="w-4 h-4" />
                Start Reading
              </Button>
            </Link>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <Link href={`/manga/${manga.id}`}>
          <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors min-h-[2.5rem]">
            {manga.title}
          </h3>
        </Link>

        {/* Author */}
        <p className="text-xs text-muted-foreground line-clamp-1">
          {manga.author}
        </p>

        {/* Stats Row */}
        <div className="flex items-center justify-between gap-2 py-1">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-primary text-primary" />
            <span className="text-xs font-medium">{manga.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {manga.chapters} Ch
            </span>
          </div>
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-1">
          {manga.genre?.slice(0, 2).map((g) => (
            <Badge
              key={g}
              variant="outline"
              className="bg-white/5 border-white/10 text-[10px] px-1.5 py-0 h-5"
            >
              {g}
            </Badge>
          ))}
          {manga.genre?.length > 2 && (
            <Badge
              variant="outline"
              className="bg-white/5 border-white/10 text-[10px] px-1.5 py-0 h-5"
            >
              +{manga.genre.length - 2}
            </Badge>
          )}
        </div>

        {/* Remove Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRemove(manga.id)}
          className="w-full gap-2 bg-transparent border-white/10 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors text-xs h-8"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove
        </Button>
      </div>
    </Card>
  );
}
