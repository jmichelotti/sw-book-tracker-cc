from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.book import CanonStatus, ReadingStatus
from app.schemas.book import (
    BookBrief,
    BookCreate,
    BookRead,
    BookSearchParams,
    BookUpdate,
    OwnedUpdate,
    PaginatedBooks,
    StatusUpdate,
)
from app.services import book_service

router = APIRouter(prefix="/books", tags=["books"])


@router.get("", response_model=PaginatedBooks)
async def search_books(
    q: str | None = None,
    author_name: str | None = None,
    character_name: str | None = None,
    series_name: str | None = None,
    canon_status: CanonStatus | None = None,
    reading_status: ReadingStatus | None = None,
    owned: bool | None = None,
    timeline_year_min: int | None = None,
    timeline_year_max: int | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    order_by: str = "title",
    order_dir: str = "asc",
    db: AsyncSession = Depends(get_db),
):
    params = BookSearchParams(
        q=q,
        author_name=author_name,
        character_name=character_name,
        series_name=series_name,
        canon_status=canon_status,
        reading_status=reading_status,
        owned=owned,
        timeline_year_min=timeline_year_min,
        timeline_year_max=timeline_year_max,
        page=page,
        page_size=page_size,
        order_by=order_by,
        order_dir=order_dir,
    )
    books, total, matched_characters = await book_service.search_books(db, params)
    items = []
    for b in books:
        items.append(
            BookBrief(
                id=b.id,
                title=b.title,
                canon_or_legends=b.canon_or_legends,
                reading_status=b.reading_status,
                owned=b.owned,
                timeline_year=b.timeline_year,
                author_name=b.author.name if b.author else None,
                cover_url=b.cover_url,
                matched_characters=matched_characters.get(b.id, []),
            )
        )
    return PaginatedBooks(items=items, total=total, page=params.page, page_size=params.page_size)


@router.get("/{book_id}/cover")
async def get_book_cover(book_id: int, db: AsyncSession = Depends(get_db)):
    from app.models import Book

    book = await db.get(Book, book_id)
    if not book or not book.cover_image:
        raise HTTPException(404, "Cover image not found")
    return Response(
        content=book.cover_image,
        media_type=book.cover_image_content_type or "image/jpeg",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get("/{book_id}", response_model=BookRead)
async def get_book(book_id: int, db: AsyncSession = Depends(get_db)):
    book = await book_service.get_book(db, book_id)
    if not book:
        raise HTTPException(404, "Book not found")

    return BookRead(
        id=book.id,
        title=book.title,
        description=book.description,
        isbn=book.isbn,
        page_count=book.page_count,
        publication_date=book.publication_date,
        cover_url=book.cover_url,
        wookieepedia_url=book.wookieepedia_url,
        canon_or_legends=book.canon_or_legends,
        reading_status=book.reading_status,
        owned=book.owned,
        timeline_year=book.timeline_year,
        timeline_year_start=book.timeline_year_start,
        timeline_year_end=book.timeline_year_end,
        author_id=book.author_id,
        author_name=book.author.name if book.author else None,
        series=[
            {"id": sl.series.id, "name": sl.series.name, "order_in_series": sl.order_in_series}
            for sl in book.series_links
        ],
        characters=[{"id": c.id, "name": c.name} for c in book.characters],
        tags=[{"id": t.id, "tag_name": t.tag_name, "category": t.category} for t in book.tags],
    )


@router.post("", response_model=BookRead, status_code=201)
async def create_book(data: BookCreate, db: AsyncSession = Depends(get_db)):
    book = await book_service.create_book(db, data)
    return await get_book(book.id, db)


@router.put("/{book_id}", response_model=BookRead)
async def update_book(book_id: int, data: BookUpdate, db: AsyncSession = Depends(get_db)):
    book = await book_service.update_book(db, book_id, data)
    if not book:
        raise HTTPException(404, "Book not found")
    return await get_book(book.id, db)


@router.delete("/{book_id}", status_code=204)
async def delete_book(book_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await book_service.delete_book(db, book_id)
    if not deleted:
        raise HTTPException(404, "Book not found")


@router.patch("/{book_id}/status", response_model=BookRead)
async def update_status(book_id: int, data: StatusUpdate, db: AsyncSession = Depends(get_db)):
    from app.models import Book

    book = await db.get(Book, book_id)
    if not book:
        raise HTTPException(404, "Book not found")
    book.reading_status = data.reading_status
    await db.commit()
    return await get_book(book_id, db)


@router.patch("/{book_id}/owned", response_model=BookRead)
async def update_owned(book_id: int, data: OwnedUpdate, db: AsyncSession = Depends(get_db)):
    from app.models import Book

    book = await db.get(Book, book_id)
    if not book:
        raise HTTPException(404, "Book not found")
    book.owned = data.owned
    await db.commit()
    return await get_book(book_id, db)
