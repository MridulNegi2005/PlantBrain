from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://user:password@host:5432/plantbrain"
    anthropic_api_key: str = ""
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    env: str = "development"
    jwt_secret: str = "change-me-in-production"
    cors_origins: str = "http://localhost:3000"
    max_upload_mb: int = 20

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
