from pydantic import BaseModel

from app.models.book import CanonStatus, ReadingStatus


class CharacterBase(BaseModel):
    name: str
    description: str | None = None


class CharacterCreate(CharacterBase):
    pass


class CharacterRead(CharacterBase):
    id: int
    model_config = {"from_attributes": True}


class CharacterBrief(BaseModel):
    id: int
    name: str
    description: str | None = None
    book_count: int = 0
    model_config = {"from_attributes": True}


class BookAppearance(BaseModel):
    id: int
    title: str
    canon_or_legends: CanonStatus
    reading_status: ReadingStatus = ReadingStatus.unread
    owned: bool = False
    timeline_year: int | None = None
    author_name: str | None = None
    appearance_tag: str | None = None
    model_config = {"from_attributes": True}


class CharacterDetail(CharacterRead):
    book_count: int = 0
    first_appearance: BookAppearance | None = None
    books: list[BookAppearance] = []
    books_total: int = 0
    books_page: int = 1
    books_page_size: int = 20


class CharacterDetailParams(BaseModel):
    canon_status: CanonStatus | None = None
    reading_status: ReadingStatus | None = None
    timeline_year_min: int | None = None
    timeline_year_max: int | None = None
    order_by: str = "timeline_year"
    order_dir: str = "asc"
    page: int = 1
    page_size: int = 20


class CharacterSearchParams(BaseModel):
    name: str | None = None
    min_book_count: int | None = None
    page: int = 1
    page_size: int = 20
    order_by: str = "name"
    order_dir: str = "asc"


class PaginatedCharacters(BaseModel):
    items: list[CharacterBrief]
    total: int
    page: int
    page_size: int
