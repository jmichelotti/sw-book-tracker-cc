from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Tag
from app.schemas.tag import TagCreate


async def list_tags(db: AsyncSession, category: str | None = None):
    query = select(Tag).order_by(Tag.tag_name)
    if category:
        query = query.where(Tag.category == category)
    result = await db.execute(query)
    return result.scalars().all()


async def create_tag(db: AsyncSession, data: TagCreate):
    tag = Tag(**data.model_dump())
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag
