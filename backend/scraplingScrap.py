"""
╔══════════════════════════════════════════════════════════════════════╗
║          SCRAPLING DEMO — Scraping a Heavily Protected Website       ║
║                                                                      ║
║  Target : G2.com  (CRM software listings)                           ║
║  Guards : Cloudflare Turnstile, DataDome, TLS fingerprinting,       ║
║           JS challenges, behavioral analysis                         ║
║                                                                      ║
║  Install:                                                            ║
║    pip install "scrapling[fetchers]"                                 ║
║    scrapling install          # downloads browsers + dependencies    ║
╚══════════════════════════════════════════════════════════════════════╝
"""

import json
import re
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from scrapling.fetchers import StealthyFetcher, StealthySession


# ─────────────────────────────────────────────
#  Data model
# ─────────────────────────────────────────────

@dataclass
class Product:
    name: str
    rating: float | None
    review_count: int | None
    category: str
    url: str


# ─────────────────────────────────────────────
#  Step 1 — Fetch with full stealth
# ─────────────────────────────────────────────

def fetch_page(url: str, session: StealthySession):
    """
    Fetch a page through the stealthy browser session.

    StealthySession does all of the following automatically:
      • Spoofs TLS fingerprint  (mimics Chrome 131 on Windows 11)
      • Randomises canvas / WebGL fingerprints
      • Injects realistic mouse-movement and scroll patterns
      • Solves Cloudflare Turnstile / Interstitial challenges
      • Waits for the network to go idle before returning the DOM
    """
    print(f"\n[→] Fetching: {url}")
    page = session.fetch(
        url,
        headless=True,           # Run browser in background
        network_idle=True,       # Wait for all XHR/fetch calls to settle
        solve_cloudflare=True,   # Auto-bypass Cloudflare challenges
        google_search=False,     # Don't fake a Google referrer
    )
    print(f"[✓] Status {page.status} — received {len(page.html):,} bytes")
    return page


# ─────────────────────────────────────────────
#  Step 2 — Extract product cards
# ─────────────────────────────────────────────

def extract_products(page, category: str) -> list[Product]:
    """
    Pull structured data out of the page.

    auto_save=True fingerprints every matched element —
    position in DOM, sibling count, attribute hash, text hash —
    and stores it in ~/.scrapling/elements.db.

    Next time you run with adaptive=True, even if G2 renames
    their CSS classes the adaptive engine will relocate the same
    elements using cosine similarity on those fingerprints.
    """
    print("\n[→] Selecting product cards (auto_save=True)...")

    cards = page.css(
        "div[class*='product-card'], li[class*='product-listing']",
        auto_save=True,   # ← stores element "DNA" for future adaptive runs
    )

    print(f"[✓] Found {len(cards)} product cards")

    products = []
    for card in cards:
        # --- Name ---
        name_el = (
            card.css("h3[class*='product-name']::text")
            or card.css("[data-testid='listing-product-name']::text")
            or card.css("a[class*='product-listing__product-name']::text")
        )
        name = name_el.get("").strip() if name_el else None
        if not name:
            continue  # skip skeleton / ad cards

        # --- Rating  (multiple possible selectors G2 has used historically) ---
        rating_str = (
            card.css("[data-score]::attr(data-score)").get()
            or card.css("[class*='rating'] span::text").get()
            or card.css("meta[itemprop='ratingValue']::attr(content)").get()
        )
        try:
            rating = round(float(rating_str), 1) if rating_str else None
        except ValueError:
            rating = None

        # --- Review count ---
        review_raw = (
            card.css("[class*='reviews-count']::text").get()
            or card.css("[class*='number-of-reviews']::text").get()
        )
        review_count = None
        if review_raw:
            digits = re.sub(r"[^\d]", "", review_raw)
            review_count = int(digits) if digits else None

        # --- URL ---
        href = card.css("a[href*='/products/']::attr(href)").get("")
        full_url = f"https://www.g2.com{href}" if href.startswith("/") else href

        products.append(Product(
            name=name,
            rating=rating,
            review_count=review_count,
            category=category,
            url=full_url,
        ))

    return products


# ─────────────────────────────────────────────
#  Step 3 — Handle pagination
# ─────────────────────────────────────────────

def paginate(session: StealthySession, start_url: str, max_pages: int = 3) -> list[Product]:
    """
    Walk through multiple pages, respecting rate limits.
    G2 will ban you if you hammer — 2–4 s delay is realistic.
    """
    all_products: list[Product] = []
    url = start_url

    for page_num in range(1, max_pages + 1):
        print(f"\n{'─'*60}")
        print(f"  PAGE {page_num} of {max_pages}")
        print(f"{'─'*60}")

        page = fetch_page(url, session)
        products = extract_products(page, category="CRM")
        all_products.extend(products)
        print(f"[✓] Cumulative total: {len(all_products)} products")

        # Find "next" button
        next_href = (
            page.css("a[data-track='Pagination_next']::attr(href)").get()
            or page.css("a[aria-label='Next page']::attr(href)").get()
            or page.css("a[rel='next']::attr(href)").get()
        )

        if not next_href or page_num == max_pages:
            print("\n[✓] Pagination complete.")
            break

        url = f"https://www.g2.com{next_href}" if next_href.startswith("/") else next_href
        delay = 2.5 + (page_num * 0.5)   # gradually slow down — looks more human
        print(f"[~] Waiting {delay:.1f}s before next page...")
        time.sleep(delay)

    return all_products


# ─────────────────────────────────────────────
#  Step 4 — Adaptive re-scrape demo
#           (simulates what happens after G2 redesigns)
# ─────────────────────────────────────────────

def adaptive_rescrape_demo(session: StealthySession, url: str):
    """
    Demonstrates Scrapling's killer feature.

    Imagine G2 ships a redesign overnight and renames all their
    CSS classes. This function shows how adaptive=True lets you
    re-locate elements using the fingerprints saved earlier —
    without touching your selectors.
    """
    print(f"\n{'═'*60}")
    print("  ADAPTIVE RE-SCRAPE DEMO")
    print("  (simulating a post-redesign run)")
    print(f"{'═'*60}")

    page = fetch_page(url, session)

    print("\n[→] Running selector with adaptive=True ...")
    print("    (Scrapling will fall back to fingerprint similarity")
    print("     if the CSS class no longer matches anything)")

    cards = page.css(
        "div[class*='product-card'], li[class*='product-listing']",
        adaptive=True,   # ← loads element.db, finds by similarity
    )

    print(f"[✓] Adaptive engine re-located {len(cards)} elements")
    print("    Your scraper survived the redesign automatically.\n")
    return cards


# ─────────────────────────────────────────────
#  Step 5 — Save results
# ─────────────────────────────────────────────

def save_results(products: list[Product], out_path: str = "g2_crm_products.json"):
    path = Path(out_path)
    data = [asdict(p) for p in products]
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"\n[✓] Saved {len(products)} products → {path.resolve()}")

    # Pretty-print a preview table
    print(f"\n{'─'*72}")
    print(f"  {'Product':<30} {'Rating':>6}  {'Reviews':>9}  Category")
    print(f"{'─'*72}")
    for p in sorted(products, key=lambda x: x.review_count or 0, reverse=True)[:10]:
        stars = f"{p.rating:.1f} ⭐" if p.rating else "  N/A"
        revs  = f"{p.review_count:,}" if p.review_count else "N/A"
        print(f"  {p.name:<30} {stars:>7}  {revs:>9}  {p.category}")
    print(f"{'─'*72}")


# ─────────────────────────────────────────────
#  Main
# ─────────────────────────────────────────────

def main():
    TARGET_URL = "https://www.g2.com/categories/crm"
    MAX_PAGES  = 3   # change to scrape more

    print("""
╔══════════════════════════════════════════════════════════════════╗
║   SCRAPLING DEMO  —  G2.com  (Cloudflare + DataDome protected)  ║
╚══════════════════════════════════════════════════════════════════╝
    """)

    # StealthySession keeps the browser open across multiple requests,
    # re-using the same fingerprint and cookies — much faster and more
    # realistic than opening a fresh browser for every page.
    with StealthySession(
        headless=True,
        solve_cloudflare=True,
        network_idle=True,
    ) as session:

        # ── Scrape all pages ──────────────────────────────────────
        products = paginate(session, TARGET_URL, max_pages=MAX_PAGES)

        # ── Save to JSON ──────────────────────────────────────────
        save_results(products, "g2_crm_products.json")

        # ── Show adaptive re-scrape capability ────────────────────
        adaptive_rescrape_demo(session, TARGET_URL)

    print("\n[✓] All done. Browser closed.\n")


if __name__ == "__main__":
    main()