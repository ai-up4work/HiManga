"use client";

import { Card } from "@/components/ui/card";
import type { Manga } from "@/lib/mock-data";
import Link from "next/link";
import { Star, BookOpen, Eye, TrendingUp, Sparkles, Lock } from "lucide-react";
import Image from "next/image";

interface RelatedMangasProps {
  mangas: Manga[];
}

export function RelatedMangas({ mangas }: RelatedMangasProps) {
  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Header */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <BookOpen className="h-5 w-5 text-pink-500" />
        <h2 className="text-2xl font-bold text-white">You May Also Like</h2>
        <span className="text-sm text-white/60 ml-auto">
          {mangas.length} {mangas.length === 1 ? "manga" : "mangas"}
        </span>
      </div>

      {/* Scrollable List */}
      <div className="w-full overflow-y-auto max-h-[80vh] bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-lg p-3 backdrop-blur-sm [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-cyan-500/40">
        {mangas.length > 0 ? (
          <div className="flex flex-col gap-3 w-full">
            {mangas.map((manga, index) => {
              const isLocked = manga.status === "Locked";
              return (
                <Link
                  key={`${manga.id}-${index}`}
                  href={isLocked ? "#" : `/manga/${manga.id}`}
                  onClick={(e) => {
                    if (isLocked) e.preventDefault();
                  }}
                  className={`w-full block ${isLocked ? "cursor-not-allowed" : ""}`}
                >
                  <Card
                    className={`group relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-white/5 transition-all duration-500 backdrop-blur-xl w-full ${
                      isLocked
                        ? ""
                        : "hover:border-pink-500/50 hover:shadow-xl hover:shadow-pink-500/20"
                    }`}
                  >
                    {/* Animated Background */}
                    {!isLocked && (
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    )}

                    {/* Card Content */}
                    <div className="relative flex flex-row gap-3 p-3 w-full">
                      {/* Cover Image */}
                      <div
                        className={`relative w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden shadow-lg ring-1 ring-white/10 transition-all duration-300 ${
                          isLocked ? "" : "group-hover:ring-pink-500/30"
                        }`}
                      >
                        <Image
                          src={manga.cover || "/placeholder.svg"}
                          alt={manga.title}
                          fill
                          className={`object-cover transition-transform duration-700 ${
                            isLocked ? "" : "group-hover:scale-110"
                          }`}
                        />

                        {/* Locked Overlay */}
                        {isLocked && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 backdrop-blur-[2px]">
                            <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm border border-white/20">
                              <Lock className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}

                        {/* Rating Badge */}
                        {!isLocked && (
                          <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg">
                            <Star className="w-2.5 h-2.5 fill-white text-white" />
                            <span className="text-[10px] font-black text-white">
                              {manga.rating}
                            </span>
                          </div>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        {/* Title & Author */}
                        <div>
                          <h3
                            className={`font-bold text-sm line-clamp-2 mb-1 transition-all duration-300 ${
                              isLocked
                                ? "text-white"
                                : "text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400 group-hover:bg-clip-text"
                            }`}
                          >
                            {manga.title}
                          </h3>
                          <p className="text-[11px] text-white/50 font-medium line-clamp-1 mb-2">
                            by {manga.author}
                          </p>

                          {/* Chapter or Coming Soon Badge */}
                          {isLocked ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 border border-white/20 w-fit backdrop-blur-sm">
                              <Sparkles className="w-2.5 h-2.5 text-white" />
                              <span className="text-[10px] font-bold text-white">
                                Coming Soon
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 w-fit">
                              <BookOpen className="w-2.5 h-2.5 text-cyan-400" />
                              <span className="text-[10px] font-bold text-cyan-300">
                                {manga.chapters} Ch
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 flex-1">
                            <Eye className="w-3 h-3 text-purple-400 flex-shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[9px] text-white/40 leading-tight">
                                Reads
                              </span>
                              <span className="text-[10px] font-bold text-white truncate">
                                {isLocked
                                  ? "---"
                                  : `${(manga.views / 1000000).toFixed(1)}M`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 flex-1">
                            <TrendingUp className="w-3 h-3 text-pink-400 flex-shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[9px] text-white/40 leading-tight">
                                Rank
                              </span>
                              <span className="text-[10px] font-bold text-white truncate">
                                {isLocked
                                  ? "---"
                                  : `#${Math.floor(Math.random() * 100) + 1}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hover Accent Line */}
                    {!isLocked && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-pink-500/60" />
            </div>
            <p className="text-white/60 font-medium text-sm">
              No related manga found at the moment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}