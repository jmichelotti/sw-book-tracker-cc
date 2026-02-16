"""Re-scrape character data for all books using a headed browser.

Usage:
    python rescrape_characters.py [--limit N] [--dry-run] [--from-json FILE]

Reads the existing scraped_books.json, visits each book's Wookieepedia page
to extract characters (with appearance tags), updates the JSON, then ingests
into the DB. The JSON is always saved first so you can re-ingest with --from-json
if the DB ingest fails.
"""

import argparse
import json
import logging
import time
from pathlib import Path

from src.browser import fetch_page_html, close_browser
from src.parsers.book_detail import parse_appearances
from src.client import ingest_books, ingest_characters
from src.config import REQUEST_DELAY

from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent / "data"


def main():
    parser = argparse.ArgumentParser(description="Re-scrape character data for all books")
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
        all_characters = data.get("characters", {})
        logger.info(f"Loaded {len(books)} books, {len(all_characters)} unique characters")
    else:
        if not json_path.exists():
            logger.error(f"No scraped data found at {json_path}")
            return

        with open(json_path) as f:
            data = json.load(f)

        books = data["books"]
        books, all_characters = scrape_characters(books, args.limit)

        # Always save JSON first so we have a fallback
        data["books"] = books
        data["characters"] = all_characters
        output_path = DATA_DIR / "scraped_books.json"
        with open(output_path, "w") as f:
            json.dump(data, f, indent=2)
        logger.info(f"Saved updated data to {output_path}")

    logger.info(f"Total unique characters: {len(all_characters)}")
    top = sorted(all_characters.items(), key=lambda x: len(x[1]), reverse=True)[:15]
    for name, book_list in top:
        logger.info(f"  {name}: appears in {len(book_list)} books")

    if args.dry_run:
        logger.info("Dry run - not ingesting into DB")
    else:
        logger.info("Ingesting into DB...")
        character_list = [{"name": name} for name in all_characters]
        ingest_characters(character_list)
        ingest_books(books)
        logger.info("Ingestion complete!")

    close_browser()


def scrape_characters(books: list[dict], limit: int) -> tuple[list[dict], dict]:
    """Scrape character appearances for each book.

    Returns (books, all_characters) where characters in each book dict are
    list[dict] with {"name": str, "tags": list[str]}, and all_characters is
    a dict mapping character name -> list of book titles.
    """
    if limit > 0:
        books_to_process = books[:limit]
    else:
        books_to_process = books

    all_characters: dict[str, list[str]] = {}
    failed: list[str] = []

    logger.info(f"Scraping characters for {len(books_to_process)} books...")

    for i, book in enumerate(books_to_process):
        url = book.get("url")
        if not url:
            logger.warning(f"No URL for {book['title']}, skipping")
            continue

        logger.info(f"[{i + 1}/{len(books_to_process)}] {book['title']}")
        try:
            html = fetch_page_html(url)
            soup = BeautifulSoup(html, "html.parser")
            appearances = parse_appearances(soup)
            characters = appearances.get("characters", [])
            book["characters"] = characters

            for entry in characters:
                char_name = entry["name"]
                all_characters.setdefault(char_name, [])
                if book["title"] not in all_characters[char_name]:
                    all_characters[char_name].append(book["title"])

            logger.info(f"  Found {len(characters)} characters")
        except Exception:
            logger.exception(f"  Failed to scrape {url}")
            failed.append(url)

        time.sleep(REQUEST_DELAY)

    logger.info(f"Done scraping. {len(failed)} failures out of {len(books_to_process)}")

    if failed:
        logger.warning(f"Failed URLs:\n" + "\n".join(failed))

    return books, all_characters


if __name__ == "__main__":
    main()
