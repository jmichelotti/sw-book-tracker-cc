from pydantic import BaseModel, field_validator


class CharacterAppearance(BaseModel):
    name: str
    tags: list[str] = []


class IngestBook(BaseModel):
    title: str
    url: str | None = None
    canon_or_legends: str = "canon"
    author: str | None = None
    description: str | None = None
    isbn: str | None = None
    page_count: int | None = None
    publication_date: str | None = None
    timeline_year: int | None = None
    timeline_year_start: int | None = None
    timeline_year_end: int | None = None
    characters: list[CharacterAppearance] = []

    @field_validator("characters", mode="before")
    @classmethod
    def normalize_characters(cls, v):
        """Accept both plain strings and {name, tags} dicts."""
        result = []
        for item in v:
            if isinstance(item, str):
                result.append({"name": item, "tags": []})
            else:
                result.append(item)
        return result


class IngestCharacter(BaseModel):
    name: str
    description: str | None = None


class IngestResult(BaseModel):
    created: int
    updated: int
    errors: int
