"use client";

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
    <div className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/30 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10">

      {/* Cover Image */}
      <Link href={`/manga/${manga.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden">
          <Image
            src={manga.cover || "/placeholder.svg"}
            alt={manga.title}
            width={240}
            height={320}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Status badge — matches trending pink style */}
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-black text-white bg-gradient-to-r from-pink-500 to-pink-600 shadow-lg shadow-pink-500/30">
            {manga.status === "ongoing" ? "Ongoing" : "Completed"}
          </span>

          {/* Hover CTA */}
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <Link href={`/manga/${manga.id}/chapter/1`}>
              <button className="w-full h-8 rounded flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg">
                <BookOpen className="w-3.5 h-3.5" />
                Start Reading
              </button>
            </Link>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <Link href={`/manga/${manga.id}`}>
          <h3 className="font-black text-sm line-clamp-2 text-white hover:text-pink-400 transition-colors min-h-[2.5rem] leading-tight">
            {manga.title}
          </h3>
        </Link>

        {/* Author */}
        <p className="text-xs text-white/50 line-clamp-1">
          {manga.author}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between gap-2 py-1">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
            <span className="text-xs font-bold text-white/70">{manga.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-white/40" />
            <span className="text-xs text-white/40">{manga.chapters} Ch</span>
          </div>
        </div>

        {/* Genre pills — same style as trending filter pills */}
        <div className="flex flex-wrap gap-1">
          {manga.genre?.slice(0, 2).map((g) => (
            <span
              key={g}
              className="px-1.5 py-0 h-5 inline-flex items-center rounded text-[10px] font-bold bg-white/10 border border-white/10 text-white/60"
            >
              {g}
            </span>
          ))}
          {manga.genre?.length > 2 && (
            <span className="px-1.5 py-0 h-5 inline-flex items-center rounded text-[10px] font-bold bg-white/10 border border-white/10 text-white/60">
              +{manga.genre.length - 2}
            </span>
          )}
        </div>

        {/* Remove — matches bookmark card's trash button style */}
        <button
          onClick={() => onRemove(manga.id)}
          className="w-full h-8 rounded flex items-center justify-center gap-1.5 text-xs font-bold bg-white/10 border border-white/10 text-white/50 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove
        </button>
      </div>
    </div>
  );
}