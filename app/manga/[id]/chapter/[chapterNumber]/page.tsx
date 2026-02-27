"use client";
import { useState, use } from "react";
import { useMangas } from "@/hooks/use-mangas";
import { MangaReader } from "@/components/manga-reader";
import { notFound } from "next/navigation";

interface ChapterPageProps {
  params: Promise<{
    id: string;
    chapterNumber: string;
  }>;
}

export default function ChapterPage({ params }: ChapterPageProps) {
  const { id, chapterNumber } = use(params);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const chapterNum = Number.parseFloat(chapterNumber);

  const {
    favoriteMangas: mangas,
    chapters,
    isLoading,
    error,
  } = useMangas("system", [id], []);

  const manga = mangas.find((m) => m.id === id);

  if (chapterNum < 1 || isNaN(chapterNum)) notFound();
  if (!isLoading && (error || !manga)) notFound();

  const totalChapters =
    chapters[id]?.length > 0 ? chapters[id].length : manga?.chapters ?? 0;

  const previousChapter = chapterNum > 1 ? chapterNum - 1 : null;
  const nextChapter = chapterNum + 1;

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div
        className={`h-full flex flex-col transition-all duration-300 ${
          isCommentsOpen ? "blur-sm" : ""
        }`}
      >
        <MangaReader
          manga={manga}
          mangaId={id}
          mangaTitle={manga?.title ?? ""}
          mangaSlug={manga?.slug}
          chapter={chapterNum}
          previousChapter={previousChapter}
          nextChapter={nextChapter}
          totalChapters={totalChapters + 1}
        />
      </div>
    </div>
  );
}