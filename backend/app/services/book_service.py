from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Author,
    Book,
    BookSeries,
    Character,
    Tag,
    book_characters,
    book_tags,
)
from app.schemas.book import BookCreate, BookSearchParams, BookUpdate


async def search_books(db: AsyncSession, params: BookSearchParams):
    query = select(Book).options(selectinload(Book.author))

    if params.q:
        pattern = f"%{params.q}%"
        query = query.where(or_(Book.title.ilike(pattern), Book.description.ilike(pattern)))

    if params.canon_status:
        query = query.where(Book.canon_or_legends == params.canon_status)

    if params.reading_status:
        query = query.where(Book.reading_status == params.reading_status)

    if params.owned is not None:
        query = query.where(Book.owned == params.owned)

    if params.author_name:
        query = query.join(Book.author).where(Author.name.ilike(f"%{params.author_name}%"))

    if params.character_name:
        query = (
            query.join(book_characters, Book.id == book_characters.c.book_id)
            .join(Character, Character.id == book_characters.c.character_id)
            .where(Character.name.ilike(f"%{params.character_name}%"))
        )

    if params.series_name:
        from app.models import Series

        query = (
            query.join(BookSeries, Book.id == BookSeries.book_id)
            .join(Series, Series.id == BookSeries.series_id)
            .where(Series.name.ilike(f"%{params.series_name}%"))
        )

    if params.timeline_year_min is not None:
        query = query.where(
            or_(
                Book.timeline_year >= params.timeline_year_min,
                Book.timeline_year_end >= params.timeline_year_min,
            )
        )

    if params.timeline_year_max is not None:
        query = query.where(
            or_(
                Book.timeline_year <= params.timeline_year_max,
                Book.timeline_year_start <= params.timeline_year_max,
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    # Ordering
    order_col = getattr(Book, params.order_by, Book.title)
    if params.order_dir == "desc":
        order_col = order_col.desc()
    query = query.order_by(order_col)

    # Pagination
    offset = (params.page - 1) * params.page_size
    query = query.offset(offset).limit(params.page_size)

    result = await db.execute(query)
    books = result.scalars().unique().all()

    # If filtering by character name, fetch matched character names per book
    matched_characters: dict[int, list[str]] = {}
    if params.character_name and books:
        book_ids = [b.id for b in books]
        char_query = (
            select(book_characters.c.book_id, Character.name)
            .join(Character, Character.id == book_characters.c.character_id)
            .where(
                book_characters.c.book_id.in_(book_ids),
                Character.name.ilike(f"%{params.character_name}%"),
            )
        )
        char_result = await db.execute(char_query)
        for book_id, char_name in char_result:
            matched_characters.setdefault(book_id, []).append(char_name)

    return books, total, matched_characters


async def get_book(db: AsyncSession, book_id: int):
    query = (
        select(Book)
        .options(
            selectinload(Book.author),
            selectinload(Book.series_links).selectinload(BookSeries.series),
            selectinload(Book.characters),
            selectinload(Book.tags),
        )
        .where(Book.id == book_id)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_book(db: AsyncSession, data: BookCreate):
    book_data = data.model_dump(exclude={"series_ids", "character_ids", "tag_ids"})
    book = Book(**book_data)
    db.add(book)
    await db.flush()

    await _sync_relations(db, book, data)
    await db.commit()
    await db.refresh(book)
    return await get_book(db, book.id)


async def update_book(db: AsyncSession, book_id: int, data: BookUpdate):
    book = await get_book(db, book_id)
    if not book:
        return None

    update_data = data.model_dump(exclude_unset=True, exclude={"series_ids", "character_ids", "tag_ids"})
    for key, value in update_data.items():
        setattr(book, key, value)

    await _sync_relations(db, book, data)
    await db.commit()
    return await get_book(db, book.id)


async def delete_book(db: AsyncSession, book_id: int):
    book = await db.get(Book, book_id)
    if not book:
        return False
    await db.delete(book)
    await db.commit()
    return True


async def _sync_relations(db: AsyncSession, book: Book, data):
    if data.series_ids is not None:
        # Clear existing
        existing = await db.execute(
            select(BookSeries).where(BookSeries.book_id == book.id)
        )
        for bs in existing.scalars().all():
            await db.delete(bs)
        await db.flush()
        for s in data.series_ids:
            db.add(BookSeries(book_id=book.id, series_id=s["series_id"], order_in_series=s.get("order_in_series")))

    if data.character_ids is not None:
        await db.execute(book_characters.delete().where(book_characters.c.book_id == book.id))
        for cid in data.character_ids:
            await db.execute(book_characters.insert().values(book_id=book.id, character_id=cid))

    if data.tag_ids is not None:
        await db.execute(book_tags.delete().where(book_tags.c.book_id == book.id))
        for tid in data.tag_ids:
            await db.execute(book_tags.insert().values(book_id=book.id, tag_id=tid))
