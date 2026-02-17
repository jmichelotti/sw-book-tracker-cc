import base64
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Book, Character, book_characters
from app.models.book import CanonStatus
from app.services.author_service import get_or_create_author
from app.services.character_service import get_or_create_character
from app.schemas.ingest import IngestBook, IngestCharacter

logger = logging.getLogger(__name__)


async def ingest_books(db: AsyncSession, books: list[IngestBook]):
    created = 0
    updated = 0
    errors = 0

    for book_data in books:
        try:
            async with db.begin_nested():
                # Find existing by title
                result = await db.execute(
                    select(Book).where(Book.title == book_data.title)
                )
                existing = result.scalar_one_or_none()

                author = None
                if book_data.author:
                    author = await get_or_create_author(db, book_data.author)

                canon = CanonStatus(book_data.canon_or_legends) if book_data.canon_or_legends else CanonStatus.canon

                if existing:
                    existing.description = book_data.description or existing.description
                    existing.isbn = book_data.isbn or existing.isbn
                    existing.page_count = book_data.page_count or existing.page_count
                    existing.publication_date = book_data.publication_date or existing.publication_date
                    existing.wookieepedia_url = book_data.url or existing.wookieepedia_url
                    existing.cover_url = book_data.cover_url or existing.cover_url
                    existing.canon_or_legends = canon
                    existing.timeline_year = book_data.timeline_year or existing.timeline_year
                    existing.timeline_year_start = book_data.timeline_year_start or existing.timeline_year_start
                    existing.timeline_year_end = book_data.timeline_year_end or existing.timeline_year_end
                    if author:
                        existing.author_id = author.id
                    book = existing
                    updated += 1
                else:
                    book = Book(
                        title=book_data.title,
                        description=book_data.description,
                        isbn=book_data.isbn,
                        page_count=book_data.page_count,
                        publication_date=book_data.publication_date,
                        wookieepedia_url=book_data.url,
                        cover_url=book_data.cover_url,
                        canon_or_legends=canon,
                        timeline_year=book_data.timeline_year,
                        timeline_year_start=book_data.timeline_year_start,
                        timeline_year_end=book_data.timeline_year_end,
                        author_id=author.id if author else None,
                    )
                    db.add(book)
                    created += 1

                await db.flush()

                # Store cover image if provided as base64
                if book_data.cover_image_b64:
                    book.cover_image = base64.b64decode(book_data.cover_image_b64)
                    book.cover_image_content_type = book_data.cover_image_content_type or "image/jpeg"
                    book.cover_url = f"/api/v1/books/{book.id}/cover"

                # Link characters with appearance tags (deduplicate by name)
                if book_data.characters:
                    await db.execute(
                        book_characters.delete().where(book_characters.c.book_id == book.id)
                    )
                    seen_char_ids: set[int] = set()
                    for char_entry in book_data.characters:
                        char = await get_or_create_character(db, char_entry.name)
                        if char.id in seen_char_ids:
                            continue
                        seen_char_ids.add(char.id)
                        tag_str = ", ".join(char_entry.tags) if char_entry.tags else None
                        await db.execute(
                            book_characters.insert().values(
                                book_id=book.id,
                                character_id=char.id,
                                appearance_tag=tag_str,
                            )
                        )

        except Exception:
            logger.exception(f"Error ingesting book: {book_data.title}")
            errors += 1

    await db.commit()
    return {"created": created, "updated": updated, "errors": errors}


async def ingest_characters(db: AsyncSession, characters: list[IngestCharacter]):
    created = 0
    updated = 0
    errors = 0

    for char_data in characters:
        try:
            result = await db.execute(
                select(Character).where(Character.name == char_data.name)
            )
            existing = result.scalar_one_or_none()

            if existing:
                if char_data.description:
                    existing.description = char_data.description
                updated += 1
            else:
                db.add(Character(name=char_data.name, description=char_data.description))
                created += 1
        except Exception:
            logger.exception(f"Error ingesting character: {char_data.name}")
            errors += 1

    await db.commit()
    return {"created": created, "updated": updated, "errors": errors}
