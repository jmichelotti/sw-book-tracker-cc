from pydantic import BaseModel

from app.schemas.book import BookBrief


class CharacterBase(BaseModel):
    name: str
    description: str | None = None


class CharacterCreate(CharacterBase):
    pass


class CharacterRead(CharacterBase):
    id: int
    model_config = {"from_attributes": True}


class CharacterWithBooks(CharacterRead):
    books: list[BookBrief] = []


class NetworkNode(BaseModel):
    id: int
    name: str
    val: int  # book appearance count


class NetworkLink(BaseModel):
    source: int
    target: int
    value: int  # co-occurrence count


class NetworkGraph(BaseModel):
    nodes: list[NetworkNode]
    links: list[NetworkLink]
