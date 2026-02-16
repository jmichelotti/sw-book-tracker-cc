from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Author, Book, Character, book_characters
from app.schemas.character import CharacterDetailParams, CharacterSearchParams


async def search_characters(db: AsyncSession, params: CharacterSearchParams):
    book_count_sq = (
        select(
            book_characters.c.character_id,
            func.count().label("book_count"),
        )
        .group_by(book_characters.c.character_id)
        .subquery()
    )

    query = (
        select(
            Character.id,
            Character.name,
            Character.description,
            func.coalesce(book_count_sq.c.book_count, 0).label("book_count"),
        )
        .outerjoin(book_count_sq, Character.id == book_count_sq.c.character_id)
    )

    if params.name:
        query = query.where(Character.name.ilike(f"%{params.name}%"))

    if params.min_book_count is not None:
        query = query.where(
            func.coalesce(book_count_sq.c.book_count, 0) >= params.min_book_count
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    # Ordering
    if params.order_by == "book_count":
        order_col = func.coalesce(book_count_sq.c.book_count, 0)
    else:
        order_col = Character.name

    if params.order_dir == "desc":
        order_col = order_col.desc()

    query = query.order_by(order_col)

    # Pagination
    offset = (params.page - 1) * params.page_size
    query = query.offset(offset).limit(params.page_size)

    result = await db.execute(query)
    characters = [
        {"id": row.id, "name": row.name, "description": row.description, "book_count": row.book_count}
        for row in result.all()
    ]

    return characters, total


async def get_character_detail(
    db: AsyncSession, character_id: int, params: CharacterDetailParams | None = None
):
    """Get character with filtered, paginated books and appearance tags."""
    if params is None:
        params = CharacterDetailParams()

    result = await db.execute(
        select(Character).where(Character.id == character_id)
    )
    character = result.scalar_one_or_none()
    if not character:
        return None

    # First appearance — always unfiltered so it stays stable
    first_app_query = (
        select(
            Book.id,
            Book.title,
            Book.canon_or_legends,
            Book.reading_status,
            Book.owned,
            Book.timeline_year,
            Author.name.label("author_name"),
            book_characters.c.appearance_tag,
        )
        .join(book_characters, Book.id == book_characters.c.book_id)
        .outerjoin(Author, Book.author_id == Author.id)
        .where(book_characters.c.character_id == character_id)
        .order_by(Book.timeline_year.asc().nulls_last())
    )
    first_app_result = await db.execute(first_app_query)
    all_books_unfiltered = first_app_result.all()

    first_appearance = None
    for b in all_books_unfiltered:
        if b.appearance_tag and "first appearance" in b.appearance_tag.lower():
            first_appearance = _book_row_to_dict(b)
            break
    if not first_appearance and all_books_unfiltered:
        first_appearance = _book_row_to_dict(all_books_unfiltered[0])

    total_book_count = len(all_books_unfiltered)

    # Filtered books query
    books_query = (
        select(
            Book.id,
            Book.title,
            Book.canon_or_legends,
            Book.reading_status,
            Book.owned,
            Book.timeline_year,
            Author.name.label("author_name"),
            book_characters.c.appearance_tag,
        )
        .join(book_characters, Book.id == book_characters.c.book_id)
        .outerjoin(Author, Book.author_id == Author.id)
        .where(book_characters.c.character_id == character_id)
    )

    if params.canon_status:
        books_query = books_query.where(Book.canon_or_legends == params.canon_status)

    if params.reading_status:
        books_query = books_query.where(Book.reading_status == params.reading_status)

    if params.timeline_year_min is not None:
        books_query = books_query.where(Book.timeline_year >= params.timeline_year_min)

    if params.timeline_year_max is not None:
        books_query = books_query.where(Book.timeline_year <= params.timeline_year_max)

    # Count filtered total
    count_query = select(func.count()).select_from(books_query.subquery())
    books_total = (await db.execute(count_query)).scalar_one()

    # Ordering
    if params.order_by == "title":
        order_col = Book.title
    elif params.order_by == "publication_date":
        order_col = Book.publication_date
    else:
        order_col = Book.timeline_year

    if params.order_dir == "desc":
        books_query = books_query.order_by(order_col.desc().nulls_last())
    else:
        books_query = books_query.order_by(order_col.asc().nulls_last())

    # Pagination
    offset = (params.page - 1) * params.page_size
    books_query = books_query.offset(offset).limit(params.page_size)

    books_result = await db.execute(books_query)
    books = [_book_row_to_dict(row) for row in books_result.all()]

    return {
        "id": character.id,
        "name": character.name,
        "description": character.description,
        "book_count": total_book_count,
        "first_appearance": first_appearance,
        "books": books,
        "books_total": books_total,
        "books_page": params.page,
        "books_page_size": params.page_size,
    }


def _book_row_to_dict(row):
    return {
        "id": row.id,
        "title": row.title,
        "canon_or_legends": row.canon_or_legends,
        "reading_status": row.reading_status,
        "owned": row.owned,
        "timeline_year": row.timeline_year,
        "author_name": row.author_name,
        "appearance_tag": row.appearance_tag,
    }


async def list_characters(db: AsyncSession):
    result = await db.execute(select(Character).order_by(Character.name))
    return result.scalars().all()


async def get_character(db: AsyncSession, character_id: int):
    query = (
        select(Character)
        .options(selectinload(Character.books))
        .where(Character.id == character_id)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_character(db: AsyncSession, name: str, description: str | None = None):
    char = Character(name=name, description=description)
    db.add(char)
    await db.commit()
    await db.refresh(char)
    return char


async def get_or_create_character(db: AsyncSession, name: str) -> Character:
    result = await db.execute(select(Character).where(Character.name == name))
    char = result.scalar_one_or_none()
    if not char:
        char = Character(name=name)
        db.add(char)
        await db.flush()
    return char
