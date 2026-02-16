from pydantic import BaseModel

from app.schemas.book import BookBrief


class SeriesBase(BaseModel):
    name: str
    description: str | None = None


class SeriesCreate(SeriesBase):
    pass


class SeriesRead(SeriesBase):
    id: int
    model_config = {"from_attributes": True}


class SeriesWithBooks(SeriesRead):
    books: list[BookBrief] = []
