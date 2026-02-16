from pydantic import BaseModel

from app.models.book import CanonStatus, ReadingStatus


class BookBrief(BaseModel):
    id: int
    title: str
    canon_or_legends: CanonStatus
    reading_status: ReadingStatus
    owned: bool
    timeline_year: int | None = None
    author_name: str | None = None
    cover_url: str | None = None
    matched_characters: list[str] = []
    model_config = {"from_attributes": True}


class BookBase(BaseModel):
    title: str
    description: str | None = None
    isbn: str | None = None
    page_count: int | None = None
    publication_date: str | None = None
    cover_url: str | None = None
    wookieepedia_url: str | None = None
    canon_or_legends: CanonStatus = CanonStatus.canon
    reading_status: ReadingStatus = ReadingStatus.unread
    owned: bool = False
    timeline_year: int | None = None
    timeline_year_start: int | None = None
    timeline_year_end: int | None = None


class BookCreate(BookBase):
    author_id: int | None = None
    series_ids: list[dict] | None = None  # [{"series_id": 1, "order_in_series": 1}]
    character_ids: list[int] | None = None
    tag_ids: list[int] | None = None


class BookUpdate(BookBase):
    title: str | None = None  # type: ignore[assignment]
    author_id: int | None = None
    series_ids: list[dict] | None = None
    character_ids: list[int] | None = None
    tag_ids: list[int] | None = None


class SeriesBrief(BaseModel):
    id: int
    name: str
    order_in_series: int | None = None
    model_config = {"from_attributes": True}


class CharacterBrief(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class TagBrief(BaseModel):
    id: int
    tag_name: str
    category: str | None = None
    model_config = {"from_attributes": True}


class BookRead(BookBase):
    id: int
    author_id: int | None = None
    author_name: str | None = None
    series: list[SeriesBrief] = []
    characters: list[CharacterBrief] = []
    tags: list[TagBrief] = []
    model_config = {"from_attributes": True}


class BookSearchParams(BaseModel):
    q: str | None = None
    author_name: str | None = None
    character_name: str | None = None
    series_name: str | None = None
    canon_status: CanonStatus | None = None
    reading_status: ReadingStatus | None = None
    owned: bool | None = None
    timeline_year_min: int | None = None
    timeline_year_max: int | None = None
    page: int = 1
    page_size: int = 20
    order_by: str = "title"
    order_dir: str = "asc"


class PaginatedBooks(BaseModel):
    items: list[BookBrief]
    total: int
    page: int
    page_size: int


class StatusUpdate(BaseModel):
    reading_status: ReadingStatus


class OwnedUpdate(BaseModel):
    owned: bool
