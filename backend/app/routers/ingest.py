from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.ingest import IngestBook, IngestCharacter, IngestResult
from app.services import ingest_service

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.post("/books", response_model=IngestResult)
async def ingest_books(books: list[IngestBook], db: AsyncSession = Depends(get_db)):
    return await ingest_service.ingest_books(db, books)


@router.post("/characters", response_model=IngestResult)
async def ingest_characters(characters: list[IngestCharacter], db: AsyncSession = Depends(get_db)):
    return await ingest_service.ingest_characters(db, characters)
