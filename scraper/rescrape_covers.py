"""Re-scrape cover images for all books and store them in PostgreSQL.

Usage:
    python rescrape_covers.py [--limit N] [--dry-run] [--from-json FILE]

Reads the existing scraped_books.json, visits each book's Wookieepedia page
to extract the cover image URL, downloads the actual image bytes, base64-encodes
them, and ingests into the DB. The JSON is always saved first (without image data)
so you can re-scrape if needed.
"""

import argparse
import base64
import json
import logging
import mimetypes
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

from src.browser import fetch_page_html, close_browser
from src.parsers.book_detail import parse_cover_image
from src.client import ingest_books
from src.config import REQUEST_DELAY, USER_AGENT

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent / "data"

IMAGE_HEADERS = {
    "User-Agent": USER_AGENT,
    "Referer": "https://starwars.fandom.com/",
}


def download_image(url: str) -> tuple[bytes, str] | None:
    """Download image bytes and determine content type. Returns (bytes, mime) or None."""
    try:
        resp = requests.get(url, headers=IMAGE_HEADERS, timeout=30)
        resp.raise_for_status()
        content_type = resp.headers.get("Content-Type", "").split(";")[0].strip()
        if not content_type.startswith("image/"):
            guessed, _ = mimetypes.guess_type(url)
            content_type = guessed or "image/jpeg"
        return resp.content, content_type
    except Exception:
        logger.exception(f"  Failed to download image: {url[:80]}")
        return None


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
        scrape_and_download_covers(books, args.limit)

        # Save JSON (strip image binary data — too large for JSON)
        books_for_json = [
            {k: v for k, v in b.items() if k not in ("cover_image_b64", "cover_image_content_type")}
            for b in books
        ]
        data["books"] = books_for_json
        output_path = DATA_DIR / "scraped_books.json"
        with open(output_path, "w") as f:
            json.dump(data, f, indent=2)
        logger.info(f"Saved updated data to {output_path}")

    with_covers = sum(1 for b in books if b.get("cover_image_b64"))
    logger.info(f"Books with downloaded cover images: {with_covers}/{len(books)}")

    if args.dry_run:
        logger.info("Dry run - not ingesting into DB")
    else:
        logger.info("Ingesting into DB...")
        ingest_books(books)
        logger.info("Ingestion complete!")

    close_browser()


def scrape_and_download_covers(books: list[dict], limit: int) -> None:
    """Scrape cover image URLs and download image bytes for each book in-place."""
    if limit > 0:
        books_to_process = books[:limit]
    else:
        books_to_process = books

    found = 0
    downloaded = 0
    failed: list[str] = []

    logger.info(f"Scraping and downloading covers for {len(books_to_process)} books...")

    for i, book in enumerate(books_to_process):
        url = book.get("url")
        if not url:
            logger.warning(f"No URL for {book['title']}, skipping")
            continue

        # Skip if already has downloaded image data
        if book.get("cover_image_b64"):
            logger.info(f"[{i + 1}/{len(books_to_process)}] {book['title']} — already has image data")
            found += 1
            continue

        cover_url = book.get("cover_url")

        # If no cover URL yet, scrape the page for it
        if not cover_url:
            logger.info(f"[{i + 1}/{len(books_to_process)}] {book['title']} — scraping page...")
            try:
                html = fetch_page_html(url)
                soup = BeautifulSoup(html, "html.parser")
                infobox = soup.find("aside", class_="portable-infobox") or soup.find(
                    "table", class_="infobox"
                )
                cover_url = parse_cover_image(infobox)
                if cover_url:
                    book["cover_url"] = cover_url
                    logger.info(f"  Found cover URL: {cover_url[:80]}...")
                else:
                    logger.info(f"  No cover image found on page")
                    continue
            except Exception:
                logger.exception(f"  Failed to scrape {url}")
                failed.append(url)
                continue
            time.sleep(REQUEST_DELAY)
        else:
            logger.info(f"[{i + 1}/{len(books_to_process)}] {book['title']} — downloading existing URL...")

        # Download the actual image
        result = download_image(cover_url)
        if result:
            image_bytes, content_type = result
            book["cover_image_b64"] = base64.b64encode(image_bytes).decode("ascii")
            book["cover_image_content_type"] = content_type
            found += 1
            downloaded += 1
            logger.info(f"  Downloaded {len(image_bytes)} bytes ({content_type})")
        else:
            failed.append(cover_url)

        time.sleep(0.5)  # Brief delay between image downloads

    logger.info(f"Done. {found} covers ready, {downloaded} newly downloaded, {len(failed)} failures")

    if failed:
        logger.warning(f"Failed URLs:\n" + "\n".join(failed))


if __name__ == "__main__":
    main()
