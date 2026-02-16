from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.book import BookBrief
from app.schemas.series import SeriesCreate, SeriesRead, SeriesWithBooks
from app.services import series_service

router = APIRouter(prefix="/series", tags=["series"])


@router.get("", response_model=list[SeriesRead])
async def list_series(db: AsyncSession = Depends(get_db)):
    return await series_service.list_series(db)


@router.get("/{series_id}", response_model=SeriesWithBooks)
async def get_series(series_id: int, db: AsyncSession = Depends(get_db)):
    series = await series_service.get_series(db, series_id)
    if not series:
        raise HTTPException(404, "Series not found")

    books = sorted(series.book_links, key=lambda bl: bl.order_in_series or 0)
    return SeriesWithBooks(
        id=series.id,
        name=series.name,
        description=series.description,
        books=[
            BookBrief(
                id=bl.book.id,
                title=bl.book.title,
                canon_or_legends=bl.book.canon_or_legends,
                reading_status=bl.book.reading_status,
                owned=bl.book.owned,
                timeline_year=bl.book.timeline_year,
                author_name=None,
                cover_url=bl.book.cover_url,
            )
            for bl in books
        ],
    )


@router.post("", response_model=SeriesRead, status_code=201)
async def create_series(data: SeriesCreate, db: AsyncSession = Depends(get_db)):
    return await series_service.create_series(db, data)
