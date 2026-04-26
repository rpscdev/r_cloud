"""Basic API tests covering health, blog, auth, and AI endpoints."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.schemas.blog import BlogPostDetail, BlogPostSummary


# ── Health / system endpoints ──────────────────────────────────────────────────

def test_health_returns_200(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200


def test_health_response_shape(client: TestClient) -> None:
    data = client.get("/health").json()
    assert "status" in data
    assert data["status"] == "ok"


def test_metrics_endpoint_accessible(client: TestClient) -> None:
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]


# ── Blog endpoints ─────────────────────────────────────────────────────────────

def test_list_posts_returns_200(client: TestClient) -> None:
    client.app.state.blog_service.list_posts.return_value = []
    response = client.get("/posts/")
    assert response.status_code == 200


def test_list_posts_returns_list(client: TestClient) -> None:
    client.app.state.blog_service.list_posts.return_value = []
    data = client.get("/posts/").json()
    assert isinstance(data, list)


def test_get_post_not_found_returns_404(client: TestClient) -> None:
    client.app.state.blog_service.get_post.return_value = None
    response = client.get("/posts/nonexistent-slug")
    assert response.status_code == 404


# ── Auth / access check ────────────────────────────────────────────────────────

def test_access_check_with_valid_password(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/api/ai/internal/access-check", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_access_check_without_password_returns_403(client: TestClient) -> None:
    response = client.get("/api/ai/internal/access-check")
    assert response.status_code == 403


# ── AI / strategy endpoints ────────────────────────────────────────────────────

def test_strategy_endpoint_rejects_missing_auth(client: TestClient) -> None:
    payload = {"business_idea": "A SaaS app for EU compliance tracking", "market_focus": "Germany"}
    response = client.post("/api/ai/internal/generate-strategy", json=payload)
    assert response.status_code == 403


def test_strategy_endpoint_validates_short_input(client: TestClient, auth_headers: dict[str, str]) -> None:
    payload = {"business_idea": "short", "market_focus": "EU"}
    response = client.post("/api/ai/internal/generate-strategy", json=payload, headers=auth_headers)
    assert response.status_code == 422
