"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Manga } from "@/lib/mock-data";
import Link from "next/link";
import { Star, BookOpen, Eye, TrendingUp, Sparkles, Lock } from "lucide-react";
import Image from "next/image";

interface RelatedMangasProps {
  mangas: Manga[];
}

export function RelatedMangas({ mangas }: RelatedMangasProps) {
  return (
    <div className="flex flex-col h-[150vh] space-y-4">
      {/* Header - Consistent with Comments Section */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <BookOpen className="h-5 w-5 text-pink-500" />
        <h2 className="text-2xl font-bold text-white">You May Also Like</h2>
        <span className="text-sm text-white/60 ml-auto">
          {mangas.length} {mangas.length === 1 ? "manga" : "mangas"}
        </span>
      </div>

      {/* Scrollable Grid Container - Matching Comment Section Style */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-lg p-3 sm:p-4 backdrop-blur-sm [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-cyan-500/40">
        {mangas.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {mangas.concat(mangas).map((manga) => {
              const isLocked = manga.status === "Locked";
              return (
                <Link
                  key={manga.id}
                  href={isLocked ? "#" : `/manga/${manga.id}`}
                  onClick={(e) => {
                    if (isLocked) e.preventDefault();
                  }}
                  className={isLocked ? "cursor-not-allowed" : ""}
                >
                  <Card
                    className={`group relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-white/5 transition-all duration-500 backdrop-blur-xl h-full ${
                      isLocked
                        ? ""
                        : "hover:border-pink-500/50 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-500/25"
                    }`}
                  >
                    {/* Animated Background Effect */}
                    {!isLocked && (
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    )}

                    {/* Content Container */}
                    <div className="relative py-0 sm:px-4 flex flex-col h-full">
                      {/* Cover and Quick Info */}
                      <div className="flex gap-3 sm:gap-4 mb-3">
                        {/* Cover Image */}
                        <div
                          className={`relative w-20 sm:w-24 h-28 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10 transition-all duration-300 ${
                            isLocked ? "" : "group-hover:ring-pink-500/30"
                          }`}
                        >
                          <Image
                            src={manga.cover || "/placeholder.svg"}
                            alt={manga.title}
                            className={`w-full h-full object-cover transition-transform duration-700 ${
                              isLocked ? "" : "group-hover:scale-110"
                            }`}
                          />

                          {/* Locked Overlay on Image */}
                          {isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 backdrop-blur-[2px]">
                              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20 shadow-xl">
                                <Lock className="w-5 h-5 text-white drop-shadow-lg" />
                              </div>
                            </div>
                          )}

                          {/* Rating Badge Overlay */}
                          {!isLocked && (
                            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg">
                              <Star className="w-3 h-3 fill-white text-white" />
                              <span className="text-xs font-black text-white">
                                {manga.rating}
                              </span>
                            </div>
                          )}

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        </div>

                        {/* Title and Author */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3
                            className={`font-bold text-sm sm:text-base line-clamp-2 mb-1.5 transition-all duration-300 ${
                              isLocked
                                ? "text-white"
                                : "text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-purple-400 group-hover:bg-clip-text"
                            }`}
                          >
                            {manga.title}
                          </h3>
                          <p className="text-xs text-white/60 font-medium line-clamp-1 mb-2">
                            by {manga.author}
                          </p>

                          {/* Chapters Badge or Coming Soon Badge */}
                          {isLocked ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 border border-white/20 w-fit backdrop-blur-sm">
                              <Sparkles className="w-3 h-3 text-white" />
                              <span className="text-xs font-bold text-white">
                                Coming Soon
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 w-fit">
                              <BookOpen className="w-3 h-3 text-cyan-400" />
                              <span className="text-xs font-bold text-cyan-300">
                                {manga.chapters} Ch
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats Bar */}
                      <div className="mt-auto pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 flex-1">
                            <Eye className="w-3.5 h-3.5 text-purple-400" />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-white/50 font-medium leading-tight">
                                Reads
                              </span>
                              <span className="text-xs font-bold text-white">
                                {isLocked
                                  ? "---"
                                  : `${(manga.views / 1000000).toFixed(1)}M`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 flex-1">
                            <TrendingUp className="w-3.5 h-3.5 text-pink-400" />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-white/50 font-medium leading-tight">
                                Rank
                              </span>
                              <span className="text-xs font-bold text-white">
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
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
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
