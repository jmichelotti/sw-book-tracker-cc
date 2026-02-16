from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Series(TimestampMixin, Base):
    __tablename__ = "series"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(500), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text)

    book_links: Mapped[list["BookSeries"]] = relationship(  # noqa: F821
        back_populates="series", cascade="all, delete-orphan"
    )
