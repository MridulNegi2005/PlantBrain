from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Postgres (hosted). Assembled into a SQLAlchemy URL so special characters in
    # the password are encoded safely — no manual percent-encoding in .env.
    postgres_db: str = "plantbrain"
    postgres_user: str = "postgres"
    postgres_password: str = ""
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    database_url: str = ""

    # LLM (Interval 3+). OpenAI-compatible client so we can point at Groq (free tier)
    # now or a local Ollama later by changing only these values.
    llm_api_key: str = ""
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_model: str = "llama-3.3-70b-versatile"
    embedding_model: str = "BAAI/bge-small-en-v1.5"

    @property
    def llm_enabled(self) -> bool:
        return bool(self.llm_api_key)

    env: str = "development"
    jwt_secret: str = "change-me-in-production"
    cors_origins: str = "http://localhost:3000"
    max_upload_mb: int = 20

    @property
    def sqlalchemy_url(self) -> URL | str:
        if self.database_url:
            return self.database_url
        return URL.create(
            "postgresql+psycopg",
            username=self.postgres_user,
            password=self.postgres_password,
            host=self.postgres_host,
            port=self.postgres_port,
            database=self.postgres_db,
        )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
