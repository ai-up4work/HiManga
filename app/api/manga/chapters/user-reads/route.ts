// app/api/manga/chapters/user-reads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPESUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPESUPABASE_ANON_KEY!
);

// ── Float-safe chapter key ────────────────────────────────────────────────────
// Canonical string so "1.5" and "1.50" are always treated the same
function toChapterKey(ch: any): string {
  return String(parseFloat(String(ch)));
}

// ── Normalize DB text[] → number[] for the frontend ──────────────────────────
function normalizeChapters(chapters: any[]): number[] {
  return (chapters || [])
    .map((ch) => parseFloat(String(ch)))
    .filter((ch) => !isNaN(ch))
    .sort((a, b) => a - b);
}

// ── Float-safe dedup check ────────────────────────────────────────────────────
function chapterExists(chapters: string[], chapter: number): boolean {
  const key = toChapterKey(chapter);
  return chapters.some((ch) => toChapterKey(ch) === key);
}

const PRIVATE_CACHE = "private, no-cache, must-revalidate";
const NO_CACHE = "no-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const mangaId = searchParams.get("mangaId");

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required", readChapters: [] },
      { status: 400 }
    );
  }

  try {
    let query = supabase
      .from("user_reads")
      .select("manga_id, chapters")
      .eq("user_id", userId);

    if (mangaId) query = query.eq("manga_id", mangaId);

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message, readChapters: [] }, { status: 500 });
    }

    if (mangaId) {
      const mangaRead = data?.[0];
      const readChapters = normalizeChapters(mangaRead?.chapters || []);
      return NextResponse.json(
        { mangaId, readChapters },
        { headers: { "Cache-Control": PRIVATE_CACHE } }
      );
    }

    const userReads = data?.map((item) => ({
      mangaId: item.manga_id,
      readChapters: normalizeChapters(item.chapters || []),
    })) || [];

    return NextResponse.json(
      { userId, reads: userReads, totalManga: userReads.length },
      { headers: { "Cache-Control": PRIVATE_CACHE } }
    );

  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error", readChapters: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const body = await req.json();
    const { mangaId, chapterNumber } = body;

    if (!userId || !mangaId || chapterNumber === undefined) {
      return NextResponse.json(
        { error: "userId, mangaId, and chapterNumber are required" },
        { status: 400 }
      );
    }

    const numChapter = parseFloat(String(chapterNumber));
    if (isNaN(numChapter)) {
      return NextResponse.json({ error: "Invalid chapterNumber" }, { status: 400 });
    }

    const { data: existingRecord, error: fetchError } = await supabase
      .from("user_reads")
      .select("chapters")
      .eq("user_id", userId)
      .eq("manga_id", mangaId)
      .single();

    const existingStrings: string[] = existingRecord && !fetchError
      ? (existingRecord.chapters || [])
      : [];

    let updatedStrings = [...existingStrings];
    if (!chapterExists(existingStrings, numChapter)) {
      updatedStrings.push(toChapterKey(numChapter));
    }

    updatedStrings.sort((a, b) => parseFloat(a) - parseFloat(b));

    const { error } = await supabase
      .from("user_reads")
      .upsert(
        {
          user_id: userId,
          manga_id: mangaId,
          chapters: updatedStrings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,manga_id" }
      )
      .select();

    if (error) {
      console.error("Upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        readChapters: normalizeChapters(updatedStrings),
        message: `Chapter ${chapterNumber} marked as read`,
      },
      { headers: { "Cache-Control": NO_CACHE } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const mangaId = searchParams.get("mangaId");
    const chapterNumber = searchParams.get("chapterNumber");

    if (!userId || !mangaId || !chapterNumber) {
      return NextResponse.json(
        { error: "userId, mangaId, and chapterNumber are required" },
        { status: 400 }
      );
    }

    const numToRemove = parseFloat(chapterNumber);
    if (isNaN(numToRemove)) {
      return NextResponse.json({ error: "Invalid chapterNumber" }, { status: 400 });
    }

    const { data: existingRecord, error: fetchError } = await supabase
      .from("user_reads")
      .select("chapters")
      .eq("user_id", userId)
      .eq("manga_id", mangaId)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const existingStrings: string[] = existingRecord.chapters || [];
    const updatedStrings = existingStrings.filter(
      (ch) => toChapterKey(ch) !== toChapterKey(numToRemove)
    );

    const { error: updateError } = await supabase
      .from("user_reads")
      .update({
        chapters: updatedStrings,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("manga_id", mangaId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        readChapters: normalizeChapters(updatedStrings),
        message: `Chapter ${chapterNumber} unmarked as read`,
      },
      { headers: { "Cache-Control": NO_CACHE } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}