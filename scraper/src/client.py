import logging

import requests

from src.config import BACKEND_URL

logger = logging.getLogger(__name__)


def ingest_books(books: list[dict]) -> None:
    url = f"{BACKEND_URL}/api/v1/ingest/books"
    logger.info(f"Sending {len(books)} books to {url}")
    resp = requests.post(url, json=books, timeout=120)
    resp.raise_for_status()
    logger.info(f"Ingest response: {resp.json()}")


def ingest_characters(characters: list[dict]) -> None:
    url = f"{BACKEND_URL}/api/v1/ingest/characters"
    logger.info(f"Sending {len(characters)} characters to {url}")
    resp = requests.post(url, json=characters, timeout=60)
    resp.raise_for_status()
    logger.info(f"Ingest response: {resp.json()}")
