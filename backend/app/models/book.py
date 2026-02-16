import enum

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class CanonStatus(str, enum.Enum):
    canon = "canon"
    legends = "legends"


class ReadingStatus(str, enum.Enum):
    unread = "unread"
    reading = "reading"
    read = "read"


class Book(TimestampMixin, Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(500), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    isbn: Mapped[str | None] = mapped_column(String(17))
    page_count: Mapped[int | None] = mapped_column(Integer)
    publication_date: Mapped[str | None] = mapped_column(String(100))
    cover_url: Mapped[str | None] = mapped_column(String(1000))
    wookieepedia_url: Mapped[str | None] = mapped_column(String(1000))

    canon_or_legends: Mapped[CanonStatus] = mapped_column(
        Enum(CanonStatus), default=CanonStatus.canon, index=True
    )
    reading_status: Mapped[ReadingStatus] = mapped_column(
        Enum(ReadingStatus), default=ReadingStatus.unread, index=True
    )
    owned: Mapped[bool] = mapped_column(default=False)

    timeline_year: Mapped[int | None] = mapped_column(Integer, index=True)
    timeline_year_start: Mapped[int | None] = mapped_column(Integer)
    timeline_year_end: Mapped[int | None] = mapped_column(Integer)

    author_id: Mapped[int | None] = mapped_column(ForeignKey("authors.id"), index=True)
    author: Mapped["Author | None"] = relationship(back_populates="books")  # noqa: F821

    series_links: Mapped[list["BookSeries"]] = relationship(  # noqa: F821
        back_populates="book", cascade="all, delete-orphan"
    )
    characters: Mapped[list["Character"]] = relationship(  # noqa: F821
        secondary="book_characters", back_populates="books"
    )
    tags: Mapped[list["Tag"]] = relationship(  # noqa: F821
        secondary="book_tags", back_populates="books"
    )
    timeline_events: Mapped[list["TimelineEvent"]] = relationship(  # noqa: F821
        secondary="book_timeline_events", back_populates="books"
    )
