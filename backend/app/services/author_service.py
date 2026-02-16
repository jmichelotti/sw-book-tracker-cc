from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Author
from app.schemas.author import AuthorCreate, AuthorUpdate


async def list_authors(db: AsyncSession):
    result = await db.execute(select(Author).order_by(Author.name))
    return result.scalars().all()


async def get_author(db: AsyncSession, author_id: int):
    query = select(Author).options(selectinload(Author.books)).where(Author.id == author_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_author(db: AsyncSession, data: AuthorCreate):
    author = Author(**data.model_dump())
    db.add(author)
    await db.commit()
    await db.refresh(author)
    return author


async def update_author(db: AsyncSession, author_id: int, data: AuthorUpdate):
    author = await db.get(Author, author_id)
    if not author:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(author, key, value)
    await db.commit()
    await db.refresh(author)
    return author


async def get_or_create_author(db: AsyncSession, name: str) -> Author:
    result = await db.execute(select(Author).where(Author.name == name))
    author = result.scalar_one_or_none()
    if not author:
        author = Author(name=name)
        db.add(author)
        await db.flush()
    return author
