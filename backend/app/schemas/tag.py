from pydantic import BaseModel


class TagBase(BaseModel):
    tag_name: str
    category: str | None = None


class TagCreate(TagBase):
    pass


class TagRead(TagBase):
    id: int
    model_config = {"from_attributes": True}
