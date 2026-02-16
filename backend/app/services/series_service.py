from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Series, BookSeries
from app.schemas.series import SeriesCreate


async def list_series(db: AsyncSession):
    result = await db.execute(select(Series).order_by(Series.name))
    return result.scalars().all()


async def get_series(db: AsyncSession, series_id: int):
    query = (
        select(Series)
        .options(selectinload(Series.book_links).selectinload(BookSeries.book))
        .where(Series.id == series_id)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_series(db: AsyncSession, data: SeriesCreate):
    series = Series(**data.model_dump())
    db.add(series)
    await db.commit()
    await db.refresh(series)
    return series
