"""Re-scrape cover image URLs for all books using a headed browser.

Usage:
    python rescrape_covers.py [--limit N] [--dry-run] [--from-json FILE]

Reads the existing scraped_books.json, visits each book's Wookieepedia page
to extract the cover image URL, updates the JSON, then ingests into the DB.
The JSON is always saved first so you can re-ingest with --from-json if the
DB ingest fails.
"""

import argparse
import json
import logging
import time
from pathlib import Path

from bs4 import BeautifulSoup

from src.browser import fetch_page_html, close_browser
from src.parsers.book_detail import parse_cover_image
from src.client import ingest_books
from src.config import REQUEST_DELAY

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent / "data"


def main():
    parser = argparse.ArgumentParser(description="Re-scrape cover images for all books")
    parser.add_argument("--limit", type=int, default=0, help="Max books to process (0 = all)")
    parser.add_argument("--dry-run", action="store_true", help="Don't ingest into DB")
    parser.add_argument("--from-json", type=str, help="Skip scraping, ingest from saved JSON file")
    args = parser.parse_args()

    json_path = DATA_DIR / "scraped_books.json"

    if args.from_json:
        logger.info(f"Loading data from {args.from_json}")
        with open(args.from_json) as f:
            data = json.load(f)
        books = data["books"]
        logger.info(f"Loaded {len(books)} books")
    else:
        if not json_path.exists():
            logger.error(f"No scraped data found at {json_path}")
            return

        with open(json_path) as f:
            data = json.load(f)

        books = data["books"]
        scrape_covers(books, args.limit)

        # Always save JSON first so we have a fallback
        data["books"] = books
        output_path = DATA_DIR / "scraped_books.json"
        with open(output_path, "w") as f:
            json.dump(data, f, indent=2)
        logger.info(f"Saved updated data to {output_path}")

    with_covers = sum(1 for b in books if b.get("cover_url"))
    logger.info(f"Books with cover images: {with_covers}/{len(books)}")

    if args.dry_run:
        logger.info("Dry run - not ingesting into DB")
    else:
        logger.info("Ingesting into DB...")
        ingest_books(books)
        logger.info("Ingestion complete!")

    close_browser()


def scrape_covers(books: list[dict], limit: int) -> None:
    """Scrape cover image URLs for each book in-place."""
    if limit > 0:
        books_to_process = books[:limit]
    else:
        books_to_process = books

    found = 0
    failed: list[str] = []

    logger.info(f"Scraping covers for {len(books_to_process)} books...")

    for i, book in enumerate(books_to_process):
        url = book.get("url")
        if not url:
            logger.warning(f"No URL for {book['title']}, skipping")
            continue

        # Skip if already has a cover
        if book.get("cover_url"):
            logger.info(f"[{i + 1}/{len(books_to_process)}] {book['title']} — already has cover")
            found += 1
            continue

        logger.info(f"[{i + 1}/{len(books_to_process)}] {book['title']}")
        try:
            html = fetch_page_html(url)
            soup = BeautifulSoup(html, "html.parser")
            infobox = soup.find("aside", class_="portable-infobox") or soup.find(
                "table", class_="infobox"
            )
            cover_url = parse_cover_image(infobox)
            if cover_url:
                book["cover_url"] = cover_url
                found += 1
                logger.info(f"  Found cover: {cover_url[:80]}...")
            else:
                logger.info(f"  No cover image found")
        except Exception:
            logger.exception(f"  Failed to scrape {url}")
            failed.append(url)

        time.sleep(REQUEST_DELAY)

    logger.info(f"Done. Found {found} covers, {len(failed)} failures out of {len(books_to_process)}")

    if failed:
        logger.warning(f"Failed URLs:\n" + "\n".join(failed))


if __name__ == "__main__":
    main()
