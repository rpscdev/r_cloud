"""Pydantic schemas for markdown blog endpoints."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class BlogPostSummary(BaseModel):
    """Summary fields used in blog grids and cards."""

    title: str
    slug: str
    date: datetime
    description: str
    image_url: str | None = None
    external_link: str | None = None
    tags: list[str] = Field(default_factory=list)
    excerpt: str
    canonical_url: str


class BlogPostDetail(BlogPostSummary):
    """Detailed article payload for /blog/{slug}."""

    html_content: str
    markdown_content: str
