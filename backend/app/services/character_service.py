from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Character, book_characters


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


async def get_network(db: AsyncSession):
    """Build co-occurrence network from book_characters table."""
    bc = book_characters

    # Nodes: characters with their book count
    node_query = (
        select(Character.id, Character.name, func.count(bc.c.book_id).label("val"))
        .join(bc, Character.id == bc.c.character_id)
        .group_by(Character.id, Character.name)
        .having(func.count(bc.c.book_id) > 0)
    )
    node_result = await db.execute(node_query)
    nodes = [{"id": row.id, "name": row.name, "val": row.val} for row in node_result.all()]

    # Links: co-occurrence (characters sharing the same book)
    bc1 = bc.alias("bc1")
    bc2 = bc.alias("bc2")
    link_query = (
        select(
            bc1.c.character_id.label("source"),
            bc2.c.character_id.label("target"),
            func.count().label("value"),
        )
        .join(bc2, bc1.c.book_id == bc2.c.book_id)
        .where(bc1.c.character_id < bc2.c.character_id)
        .group_by(bc1.c.character_id, bc2.c.character_id)
    )
    link_result = await db.execute(link_query)
    links = [{"source": row.source, "target": row.target, "value": row.value} for row in link_result.all()]

    return {"nodes": nodes, "links": links}
