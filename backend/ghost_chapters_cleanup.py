import os
import sys
import re
import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ppfbpmbomksqlgojwdhr.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZmJwbWJvbWtzcWxnb2p3ZGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NTQ5NDMsImV4cCI6MjA3NjQzMDk0M30.5j7kSkZhoMZgvCGcxdG2phuoN3dwout3JgD1i1cUqaY")


if not SUPABASE_URL or not SUPABASE_KEY:
    print("✗ Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
MANGA_BASE_URL = "https://www.mangaread.org/manga/"
DRY_RUN = True  # Set to False to actually delete


def get_source_chapters(manga_slug):
    """Scrape available chapter numbers from mangaread.org"""
    url = f"{MANGA_BASE_URL}{manga_slug}/"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        chapters = set()
        for link in soup.select('ul.main li a'):
            href = link.get('href', '')
            if '/chapter-' in href:
                match = re.search(r'chapter-([\d]+(?:\.[\d]+|-[\d]+)?)', href)
                if match:
                    try:
                        chapters.add(round(float(match.group(1).replace('-', '.')), 2))
                    except ValueError:
                        continue
        return chapters
    except Exception as e:
        print(f"  ✗ Error fetching source: {e}")
        return set()


def get_all_mangas():
    result = supabase.table('mangas').select('id, title, slug, total_chapters').execute()
    return result.data


def get_all_chapters_for_manga(manga_id):
    result = supabase.table('chapters').select('id, chapter_number').eq('manga_id', manga_id).execute()
    return result.data


def delete_chapter(chapter_id, chapter_number):
    supabase.table('panels').delete().eq('chapter_id', chapter_id).execute()
    supabase.table('chapters').delete().eq('id', chapter_id).execute()
    print(f"    🗑  Deleted chapter {chapter_number} (id: {chapter_id})")


def main():
    print("=" * 60)
    print(f"GHOST CHAPTER CLEANUP  |  DRY_RUN={DRY_RUN}")
    print("=" * 60)

    mangas = get_all_mangas()
    print(f"\nFound {len(mangas)} mangas:\n")
    for i, m in enumerate(mangas, 1):
        print(f"  [{i:>2}] {m['title']}  (db chapters: {m['total_chapters']})")

    print("\nEnter manga numbers to check (comma-separated), or 'all': ", end="")
    choice = input().strip()

    if choice.lower() == 'all':
        selected = mangas
    else:
        indices = [int(x.strip()) - 1 for x in choice.split(',')]
        selected = [mangas[i] for i in indices]

    total_deleted = 0

    for manga in selected:
        manga_id    = manga['id']
        manga_title = manga['title']
        manga_slug  = manga['slug']

        print(f"\n{'=' * 60}")
        print(f"Manga: {manga_title}  (slug: {manga_slug})")
        print(f"{'=' * 60}")

        # Get DB chapters
        chapters = get_all_chapters_for_manga(manga_id)
        db_nums  = {round(float(str(c['chapter_number'])), 2): c for c in chapters}
        db_set   = set(db_nums.keys())
        print(f"  DB chapters    : {len(db_set)}")

        # Get source chapters
        print(f"  Fetching from mangaread.org...")
        source_set = get_source_chapters(manga_slug)
        print(f"  Source chapters: {len(source_set)}")

        # Find ghosts
        ghosts = sorted(db_set - source_set)

        if not ghosts:
            print(f"  ✓ No ghost chapters found!")
            continue

        print(f"\n  ⚠ Ghost chapters ({len(ghosts)}) — in DB but NOT on source:")
        print(f"    {ghosts}\n")

        print(f"  Delete all {len(ghosts)} ghost chapters? (yes / no / pick): ", end="")
        answer = input().strip().lower()

        if answer in ('no', ''):
            print("  Skipped.")
            continue
        elif answer == 'yes':
            targets = ghosts
        elif answer == 'pick':
            print("  Enter chapter numbers to delete (comma-separated): ", end="")
            targets = [round(float(x.strip()), 2) for x in input().split(',')]
        else:
            print("  Invalid input, skipping.")
            continue

        for num in targets:
            match = db_nums.get(num)
            if not match:
                print(f"  ✗ Chapter {num} not found, skipping")
                continue

            if DRY_RUN:
                print(f"  [DRY RUN] Would delete chapter {num} (id: {match['id']})")
            else:
                delete_chapter(match['id'], num)
                total_deleted += 1

    print(f"\n{'=' * 60}")
    if DRY_RUN:
        print("DRY RUN complete — no changes made. Set DRY_RUN=False to delete.")
    else:
        print(f"Done. Deleted {total_deleted} ghost chapter(s).")
    print("=" * 60)


if __name__ == "__main__":
    main()