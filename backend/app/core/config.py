"""Application settings for EU Market Strategy AI."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"
load_dotenv(ENV_FILE)


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "EU Market Strategy AI"
    app_env: str = Field(default="development", alias="APP_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    api_prefix: str = Field(default="/api/ai/internal", alias="API_PREFIX")
    cors_origins: str = Field(default="http://localhost:5173", alias="CORS_ORIGINS")
    enable_hsts: bool = Field(default=False, alias="ENABLE_HSTS")

    gemini_api_key: str = Field(..., alias="GROQ_API_KEY")
    gemini_model: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_MODEL")
    tavily_api_key: str = Field(..., alias="TAVILY_API_KEY")
    app_access_password: str = Field(..., alias="APP_ACCESS_PASSWORD")

    gemini_timeout_seconds: int = Field(default=90, alias="GROQ_TIMEOUT_SECONDS")
    gemini_max_output_tokens: int = Field(default=4096, alias="GROQ_MAX_OUTPUT_TOKENS")
    strategy_context_char_limit: int = Field(default=24000, alias="STRATEGY_CONTEXT_CHAR_LIMIT")

    blog_content_dir: str = Field(default="content/blog", alias="BLOG_CONTENT_DIR")
    blog_images_dir: str = Field(default="content/images", alias="BLOG_IMAGES_DIR")

    chroma_persist_dir: str = Field(default="data/chroma", alias="CHROMA_PERSIST_DIR")
    chroma_collection: str = Field(default="eu_market_regulations", alias="CHROMA_COLLECTION")
    embedding_model_name: str = Field(default="all-MiniLM-L6-v2", alias="EMBEDDING_MODEL_NAME")
    chunk_size_words: int = Field(default=500, alias="CHUNK_SIZE_WORDS")
    chunk_overlap_words: int = Field(default=80, alias="CHUNK_OVERLAP_WORDS")

    regulation_download_dir: str = Field(default="data/regulations", alias="REGULATION_DOWNLOAD_DIR")
    local_regulation_pdfs_dir: str = Field(default="data/regulation_pdfs", alias="LOCAL_REGULATION_PDFS_DIR")
    report_output_dir: str = Field(default="data/reports", alias="REPORT_OUTPUT_DIR")
    balloon_data_path: str = Field(default="data/balloon.jsonl", alias="BALLOON_DATA_PATH")
    allowed_domains: str = Field(
        default="eur-lex.europa.eu,ec.europa.eu,bundesregierung.de",
        alias="ALLOWED_REGULATION_DOMAINS",
    )
    tavily_max_results: int = Field(default=8, alias="TAVILY_MAX_RESULTS")
    max_pdf_size_mb: int = Field(default=20, alias="MAX_PDF_SIZE_MB")
    tavily_timeout_seconds: int = Field(default=30, alias="TAVILY_TIMEOUT_SECONDS")

    @field_validator("gemini_api_key", "tavily_api_key", "app_access_password")  # gemini_api_key maps to GROQ_API_KEY
    @classmethod
    def require_non_empty_secret(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Required secret is missing in backend/.env.")
        return cleaned

    @field_validator("gemini_timeout_seconds")
    @classmethod
    def validate_gemini_timeout(cls, value: int) -> int:
        if value < 10 or value > 300:
            raise ValueError("GEMINI_TIMEOUT_SECONDS must be between 10 and 300.")
        return value

    @field_validator("gemini_max_output_tokens")
    @classmethod
    def validate_max_output_tokens(cls, value: int) -> int:
        if value < 256 or value > 8192:
            raise ValueError("GEMINI_MAX_OUTPUT_TOKENS must be between 256 and 8192.")
        return value

    @field_validator("strategy_context_char_limit")
    @classmethod
    def validate_context_limit(cls, value: int) -> int:
        if value < 4000 or value > 120000:
            raise ValueError("STRATEGY_CONTEXT_CHAR_LIMIT must be between 4000 and 120000.")
        return value

    @field_validator("chunk_size_words")
    @classmethod
    def chunk_size_must_be_positive(cls, value: int) -> int:
        if value < 100:
            raise ValueError("CHUNK_SIZE_WORDS must be at least 100.")
        return value

    @field_validator("chunk_overlap_words")
    @classmethod
    def chunk_overlap_is_valid(cls, value: int) -> int:
        if value < 0:
            raise ValueError("CHUNK_OVERLAP_WORDS cannot be negative.")
        return value

    @field_validator("max_pdf_size_mb")
    @classmethod
    def validate_pdf_size(cls, value: int) -> int:
        if value < 1 or value > 100:
            raise ValueError("MAX_PDF_SIZE_MB must be between 1 and 100.")
        return value

    @field_validator("api_prefix")
    @classmethod
    def validate_api_prefix(cls, value: str) -> str:
        cleaned = value.strip()
        if cleaned and not cleaned.startswith("/"):
            raise ValueError("API_PREFIX must be empty or start with '/'.")
        return cleaned.rstrip("/") or ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def allowed_domain_list(self) -> list[str]:
        return [domain.strip().lower() for domain in self.allowed_domains.split(",") if domain.strip()]

    @property
    def max_pdf_size_bytes(self) -> int:
        return self.max_pdf_size_mb * 1024 * 1024

    @property
    def resolved_blog_content_dir(self) -> Path:
        path = Path(self.blog_content_dir)
        return path if path.is_absolute() else BASE_DIR / path

    @property
    def resolved_blog_images_dir(self) -> Path:
        path = Path(self.blog_images_dir)
        return path if path.is_absolute() else BASE_DIR / path

    @property
    def resolved_balloon_data_path(self) -> Path:
        path = Path(self.balloon_data_path)
        return path if path.is_absolute() else BASE_DIR / path


@lru_cache
def get_settings() -> Settings:
    return Settings()
