from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.character import CharacterCreate, CharacterRead, CharacterWithBooks, NetworkGraph
from app.services import character_service

router = APIRouter(prefix="/characters", tags=["characters"])


@router.get("", response_model=list[CharacterRead])
async def list_characters(db: AsyncSession = Depends(get_db)):
    return await character_service.list_characters(db)


@router.get("/network", response_model=NetworkGraph)
async def get_network(db: AsyncSession = Depends(get_db)):
    return await character_service.get_network(db)


@router.get("/{character_id}", response_model=CharacterWithBooks)
async def get_character(character_id: int, db: AsyncSession = Depends(get_db)):
    char = await character_service.get_character(db, character_id)
    if not char:
        raise HTTPException(404, "Character not found")
    return char


@router.post("", response_model=CharacterRead, status_code=201)
async def create_character(data: CharacterCreate, db: AsyncSession = Depends(get_db)):
    return await character_service.create_character(db, data.name, data.description)
