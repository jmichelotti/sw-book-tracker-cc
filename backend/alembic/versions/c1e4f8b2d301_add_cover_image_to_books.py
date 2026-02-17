"""add cover_image to books

Revision ID: c1e4f8b2d301
Revises: a3a73d9a5acd
Create Date: 2026-02-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1e4f8b2d301'
down_revision: Union[str, None] = 'a3a73d9a5acd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('books', sa.Column('cover_image', sa.LargeBinary(), nullable=True))
    op.add_column('books', sa.Column('cover_image_content_type', sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column('books', 'cover_image_content_type')
    op.drop_column('books', 'cover_image')
