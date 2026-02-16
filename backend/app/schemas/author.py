from pydantic import BaseModel


class AuthorBase(BaseModel):
    name: str
    bio: str | None = None


class AuthorCreate(AuthorBase):
    pass


class AuthorUpdate(AuthorBase):
    pass


class AuthorRead(AuthorBase):
    id: int
    model_config = {"from_attributes": True}


class AuthorWithBooks(AuthorRead):
    books: list["BookBrief"] = []


from app.schemas.book import BookBrief  # noqa: E402

AuthorWithBooks.model_rebuild()
