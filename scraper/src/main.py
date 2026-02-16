import argparse
import json
import logging
import os
import time
from pathlib import Path

from src.parsers.book_list import scrape_book_list
from src.parsers.book_detail import scrape_book_detail
from src.client import ingest_books, ingest_characters
from src.config import REQUEST_DELAY
from src.browser import close_browser

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(os.getenv("DATA_DIR", str(Path(__file__).resolve().parents[1] / "data")))


def main():
    parser = argparse.ArgumentParser(description="Scrape Star Wars EU books from Wookieepedia")
    parser.add_argument("--dry-run", action="store_true", help="Parse but don't send to backend")
    parser.add_argument("--limit", type=int, default=0, help="Max books to scrape (0 = all)")
    parser.add_argument("--from-json", type=str, help="Skip scraping, ingest from a saved JSON file")
    args = parser.parse_args()

    if args.from_json:
        logger.info(f"Loading books from {args.from_json}")
        with open(args.from_json) as f:
            saved = json.load(f)
        books = saved["books"]
        all_characters = saved["characters"]
        logger.info(f"Loaded {len(books)} books, {len(all_characters)} characters from JSON")
    else:
        books, all_characters = scrape_all(args.limit)

    if args.dry_run:
        logger.info("Dry run - not sending to backend")
        for b in books[:5]:
            logger.info(f"  {b['title']} by {b.get('author', 'Unknown')}")
        return

    character_list = [{"name": name} for name in all_characters]
    ingest_characters(character_list)
    ingest_books(books)

    close_browser()


def scrape_all(limit: int) -> tuple[list[dict], dict[str, list[str]]]:
    logger.info("Starting book list scrape...")
    book_entries = scrape_book_list()
    logger.info(f"Found {len(book_entries)} books")

    if limit > 0:
        book_entries = book_entries[:limit]
        logger.info(f"Limited to {len(book_entries)} books")

    books = []
    all_characters: dict[str, list[str]] = {}
    failed: list[str] = []

    for i, entry in enumerate(book_entries):
        logger.info(f"[{i + 1}/{len(book_entries)}] Scraping: {entry['title']}")
        try:
            detail = scrape_book_detail(entry["url"])
            book = {**entry, **detail}
            books.append(book)
            for char_name in detail.get("characters", []):
                all_characters.setdefault(char_name, [])
                if entry["title"] not in all_characters[char_name]:
                    all_characters[char_name].append(entry["title"])
        except Exception:
            logger.exception(f"Failed to scrape {entry['url']}")
            failed.append(entry["url"])
        time.sleep(REQUEST_DELAY)

    logger.info(f"Scraped {len(books)} books, {len(failed)} failures")

    # Save to JSON for reuse
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    output_path = DATA_DIR / "scraped_books.json"
    with open(output_path, "w") as f:
        json.dump({"books": books, "characters": all_characters}, f, indent=2)
    logger.info(f"Saved scraped data to {output_path}")

    if failed:
        logger.warning(f"Failed URLs:\n" + "\n".join(failed))

    close_browser()

    return books, all_characters


if __name__ == "__main__":
    main()
