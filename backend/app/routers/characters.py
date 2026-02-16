from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.book import CanonStatus, ReadingStatus
from app.schemas.character import (
    CharacterCreate,
    CharacterDetail,
    CharacterDetailParams,
    CharacterRead,
    CharacterSearchParams,
    PaginatedCharacters,
)
from app.services import character_service

router = APIRouter(prefix="/characters", tags=["characters"])


@router.get("/search", response_model=PaginatedCharacters)
async def search_characters(
    name: str | None = None,
    min_book_count: int | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    order_by: str = "name",
    order_dir: str = "asc",
    db: AsyncSession = Depends(get_db),
):
    params = CharacterSearchParams(
        name=name,
        min_book_count=min_book_count,
        page=page,
        page_size=page_size,
        order_by=order_by,
        order_dir=order_dir,
    )
    characters, total = await character_service.search_characters(db, params)
    return PaginatedCharacters(items=characters, total=total, page=page, page_size=page_size)


@router.get("/{character_id}", response_model=CharacterDetail)
async def get_character(
    character_id: int,
    canon_status: CanonStatus | None = None,
    reading_status: ReadingStatus | None = None,
    timeline_year_min: int | None = None,
    timeline_year_max: int | None = None,
    order_by: str = "timeline_year",
    order_dir: str = "asc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    params = CharacterDetailParams(
        canon_status=canon_status,
        reading_status=reading_status,
        timeline_year_min=timeline_year_min,
        timeline_year_max=timeline_year_max,
        order_by=order_by,
        order_dir=order_dir,
        page=page,
        page_size=page_size,
    )
    detail = await character_service.get_character_detail(db, character_id, params)
    if not detail:
        raise HTTPException(404, "Character not found")
    return detail


@router.post("", response_model=CharacterRead, status_code=201)
async def create_character(data: CharacterCreate, db: AsyncSession = Depends(get_db)):
    return await character_service.create_character(db, data.name, data.description)
