from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.tag import TagCreate, TagRead
from app.services import tag_service

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagRead])
async def list_tags(category: str | None = None, db: AsyncSession = Depends(get_db)):
    return await tag_service.list_tags(db, category)


@router.post("", response_model=TagRead, status_code=201)
async def create_tag(data: TagCreate, db: AsyncSession = Depends(get_db)):
    return await tag_service.create_tag(db, data)
