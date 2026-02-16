from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://swtracker:swtracker@db:5432/swbooktracker"

    model_config = {"env_file": ".env"}


settings = Settings()
