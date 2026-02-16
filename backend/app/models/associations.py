from sqlalchemy import Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

book_characters = Table(
    "book_characters",
    Base.metadata,
    Column("book_id", Integer, ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
    Column("character_id", Integer, ForeignKey("characters.id", ondelete="CASCADE"), primary_key=True),
    Column("appearance_tag", String(255), nullable=True),
)

book_tags = Table(
    "book_tags",
    Base.metadata,
    Column("book_id", Integer, ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

book_timeline_events = Table(
    "book_timeline_events",
    Base.metadata,
    Column("book_id", Integer, ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
    Column("timeline_event_id", Integer, ForeignKey("timeline_events.id", ondelete="CASCADE"), primary_key=True),
)


class BookSeries(Base):
    __tablename__ = "book_series"

    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
    series_id: Mapped[int] = mapped_column(ForeignKey("series.id", ondelete="CASCADE"), primary_key=True)
    order_in_series: Mapped[int | None] = mapped_column(Integer)

    book: Mapped["Book"] = relationship(back_populates="series_links")  # noqa: F821
    series: Mapped["Series"] = relationship(back_populates="book_links")  # noqa: F821
