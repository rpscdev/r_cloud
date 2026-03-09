"""Public blog endpoints backed by git-tracked Markdown files."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.concurrency import run_in_threadpool

from app.blog.service import MarkdownBlogService
from app.schemas.blog import BlogPostDetail, BlogPostSummary

router = APIRouter(tags=["blog"])


def _get_service(request: Request) -> MarkdownBlogService:
    service = getattr(request.app.state, "blog_service", None)
    if service is None:
        raise HTTPException(status_code=500, detail="Blog service is not initialized.")
    return service


@router.get("/posts/", response_model=list[BlogPostSummary])
async def list_posts(
    request: Request,
    limit: int | None = Query(default=None, ge=1, le=50),
) -> list[BlogPostSummary]:
    """Return latest blog posts from content/blog markdown files."""

    service = _get_service(request)
    return await run_in_threadpool(service.list_posts, limit=limit)


@router.get("/posts/{slug}", response_model=BlogPostDetail)
async def get_post(slug: str, request: Request) -> BlogPostDetail:
    """Return one full markdown blog post by slug."""

    service = _get_service(request)
    post = await run_in_threadpool(service.get_post, slug)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post
