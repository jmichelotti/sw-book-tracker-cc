from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.author import AuthorCreate, AuthorRead, AuthorUpdate, AuthorWithBooks
from app.services import author_service

router = APIRouter(prefix="/authors", tags=["authors"])


@router.get("", response_model=list[AuthorRead])
async def list_authors(db: AsyncSession = Depends(get_db)):
    return await author_service.list_authors(db)


@router.get("/{author_id}", response_model=AuthorWithBooks)
async def get_author(author_id: int, db: AsyncSession = Depends(get_db)):
    author = await author_service.get_author(db, author_id)
    if not author:
        raise HTTPException(404, "Author not found")
    return author


@router.post("", response_model=AuthorRead, status_code=201)
async def create_author(data: AuthorCreate, db: AsyncSession = Depends(get_db)):
    return await author_service.create_author(db, data)


@router.put("/{author_id}", response_model=AuthorRead)
async def update_author(author_id: int, data: AuthorUpdate, db: AsyncSession = Depends(get_db)):
    author = await author_service.update_author(db, author_id, data)
    if not author:
        raise HTTPException(404, "Author not found")
    return author
