"""One-time script to fix author names in scraped_books.json and re-ingest."""
import json
import re
from pathlib import Path

from src.parsers.book_detail import clean_author_string
from src.client import ingest_books

DATA_DIR = Path(__file__).resolve().parent / "data"


def main():
    json_path = DATA_DIR / "scraped_books.json"
    with open(json_path) as f:
        data = json.load(f)

    fixed = 0
    for book in data["books"]:
        if book.get("author"):
            cleaned = clean_author_string(book["author"])
            if cleaned != book["author"]:
                print(f"  {book['author'][:55]:55s} -> {cleaned}")
                book["author"] = cleaned
                fixed += 1

    print(f"\nFixed {fixed} author names in JSON")

    with open(json_path, "w") as f:
        json.dump(data, f, indent=2)
    print("Saved updated JSON")

    print("Re-ingesting books into DB...")
    ingest_books(data["books"])
    print("Done!")


if __name__ == "__main__":
    main()
