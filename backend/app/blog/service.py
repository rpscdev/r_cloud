"""Git-backed Markdown blog loading and caching utilities."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any

import frontmatter
import markdown

from app.core.config import Settings
from app.schemas.blog import BlogPostDetail, BlogPostSummary

logger = logging.getLogger(__name__)

SLUG_RE = re.compile(r"[^a-z0-9-]+")
WHITESPACE_RE = re.compile(r"\s+")


@dataclass(slots=True)
class _BlogCacheItem:
    """Internal representation of one parsed Markdown blog post."""

    title: str
    slug: str
    date: datetime
    description: str
    image_url: str | None
    external_link: str | None
    tags: list[str]
    excerpt: str
    canonical_url: str
    html_content: str
    markdown_content: str


class MarkdownBlogService:
    """Loads Markdown blog files from git-tracked content directory."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._content_dir = settings.resolved_blog_content_dir
        self._images_dir = settings.resolved_blog_images_dir

        self._content_dir.mkdir(parents=True, exist_ok=True)
        self._images_dir.mkdir(parents=True, exist_ok=True)

        self._lock = Lock()
        self._signature: tuple[tuple[str, int, int], ...] | None = None
        self._items: list[_BlogCacheItem] = []
        self._by_slug: dict[str, _BlogCacheItem] = {}

    def list_posts(self, *, limit: int | None = None) -> list[BlogPostSummary]:
        """Return blog post summaries sorted by newest first."""

        self._refresh_cache_if_needed()
        items = self._items[:limit] if limit else self._items
        return [self._to_summary(item) for item in items]

    def get_post(self, slug: str) -> BlogPostDetail | None:
        """Return one full blog post by slug."""

        self._refresh_cache_if_needed()
        item = self._by_slug.get(slug)
        if not item:
            return None

        summary = self._to_summary(item)
        return BlogPostDetail(
            **summary.model_dump(),
            html_content=item.html_content,
            markdown_content=item.markdown_content,
        )

    def _refresh_cache_if_needed(self) -> None:
        files = self._discover_markdown_files()
        signature = self._build_signature(files)

        if signature == self._signature:
            return

        with self._lock:
            files = self._discover_markdown_files()
            signature = self._build_signature(files)
            if signature == self._signature:
                return

            parsed_items: list[_BlogCacheItem] = []
            for file_path in files:
                try:
                    parsed = self._parse_markdown_file(file_path)
                    if parsed:
                        parsed_items.append(parsed)
                except Exception:  # noqa: BLE001
                    logger.exception("Failed to parse blog post: %s", file_path)

            parsed_items.sort(key=lambda item: item.date, reverse=True)
            self._items = parsed_items
            self._by_slug = {item.slug: item for item in parsed_items}
            self._signature = signature
            logger.info("Loaded %s markdown blog posts", len(parsed_items))

    def _discover_markdown_files(self) -> list[Path]:
        markdown_files = list(self._content_dir.glob("*.md")) + list(self._content_dir.glob("*.markdown"))
        return sorted(
            file_path
            for file_path in markdown_files
            if file_path.is_file() and file_path.stem.lower() != "readme"
        )

    @staticmethod
    def _build_signature(files: list[Path]) -> tuple[tuple[str, int, int], ...]:
        return tuple((file_path.name, file_path.stat().st_mtime_ns, file_path.stat().st_size) for file_path in files)

    def _parse_markdown_file(self, file_path: Path) -> _BlogCacheItem | None:
        post = frontmatter.load(file_path)
        metadata: dict[str, Any] = dict(post.metadata)

        slug = self._resolve_slug(metadata.get("slug"), file_path.stem)
        title = str(metadata.get("title") or slug.replace("-", " ").title()).strip()
        if not title:
            logger.warning("Skipping markdown without title: %s", file_path)
            return None

        parsed_date = self._parse_date(metadata.get("date"), file_path)
        markdown_content = str(post.content or "").strip()
        if not markdown_content:
            logger.warning("Skipping empty markdown body: %s", file_path)
            return None

        html_content = markdown.markdown(
            markdown_content,
            extensions=["extra", "fenced_code", "tables", "sane_lists", "nl2br"],
            output_format="html5",
        )

        description = str(metadata.get("description") or "").strip() or self._excerpt_from_markdown(markdown_content, 180)
        excerpt = self._excerpt_from_markdown(markdown_content, 220)
        external_link = str(metadata.get("external_link") or "").strip() or None
        image_url = self._resolve_image_url(metadata.get("image"))
        tags = self._normalize_tags(metadata.get("tags"))
        canonical_url = f"/blog/{slug}"

        return _BlogCacheItem(
            title=title,
            slug=slug,
            date=parsed_date,
            description=description,
            image_url=image_url,
            external_link=external_link,
            tags=tags,
            excerpt=excerpt,
            canonical_url=canonical_url,
            html_content=html_content,
            markdown_content=markdown_content,
        )

    @staticmethod
    def _resolve_slug(raw_slug: Any, fallback: str) -> str:
        value = str(raw_slug or fallback).strip().lower().replace("_", "-")
        value = value.replace(" ", "-")
        value = SLUG_RE.sub("", value)
        value = re.sub(r"-{2,}", "-", value).strip("-")
        return value or fallback.lower()

    @staticmethod
    def _normalize_tags(raw_tags: Any) -> list[str]:
        if isinstance(raw_tags, list):
            return [str(tag).strip() for tag in raw_tags if str(tag).strip()]
        if isinstance(raw_tags, str):
            return [tag.strip() for tag in raw_tags.split(",") if tag.strip()]
        return []

    def _resolve_image_url(self, raw_image: Any) -> str | None:
        if not raw_image:
            return None

        image_value = str(raw_image).strip()
        if not image_value:
            return None

        if image_value.startswith("http://") or image_value.startswith("https://"):
            return image_value

        if image_value.startswith("/api/images/") or image_value.startswith("/images/"):
            return image_value

        normalized = image_value.lstrip("/")
        return f"/api/images/{normalized}"

    @staticmethod
    def _excerpt_from_markdown(text: str, max_len: int) -> str:
        cleaned = text
        cleaned = re.sub(r"```.*?```", " ", cleaned, flags=re.DOTALL)
        cleaned = re.sub(r"`([^`]+)`", r"\1", cleaned)
        cleaned = re.sub(r"!\[[^\]]*\]\([^\)]*\)", " ", cleaned)
        cleaned = re.sub(r"\[[^\]]+\]\([^\)]*\)", " ", cleaned)
        cleaned = re.sub(r"[#>*_~\-]", " ", cleaned)
        cleaned = WHITESPACE_RE.sub(" ", cleaned).strip()
        if len(cleaned) <= max_len:
            return cleaned
        return f"{cleaned[:max_len].rstrip()}..."

    @staticmethod
    def _parse_date(raw_date: Any, file_path: Path) -> datetime:
        if isinstance(raw_date, datetime):
            return raw_date if raw_date.tzinfo else raw_date.replace(tzinfo=timezone.utc)

        if raw_date:
            raw = str(raw_date).strip()
            for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S"):
                try:
                    parsed = datetime.strptime(raw, fmt)
                    return parsed.replace(tzinfo=timezone.utc)
                except ValueError:
                    continue
            try:
                parsed = datetime.fromisoformat(raw)
                return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
            except ValueError:
                logger.warning("Invalid blog date '%s' in %s, using file modified time", raw, file_path)

        return datetime.fromtimestamp(file_path.stat().st_mtime, tz=timezone.utc)

    @staticmethod
    def _to_summary(item: _BlogCacheItem) -> BlogPostSummary:
        return BlogPostSummary(
            title=item.title,
            slug=item.slug,
            date=item.date,
            description=item.description,
            image_url=item.image_url,
            external_link=item.external_link,
            tags=item.tags,
            excerpt=item.excerpt,
            canonical_url=item.canonical_url,
        )
