"""Pytest fixtures for the FastAPI application test suite."""

from __future__ import annotations

import os
from collections.abc import Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Provide required env vars before the app module is imported.
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("TAVILY_API_KEY", "test-tavily-key")
os.environ.setdefault("APP_ACCESS_PASSWORD", "test-password")
os.environ.setdefault("STRATEGY_CONTEXT_CHAR_LIMIT", "6000")


@pytest.fixture(scope="session")
def mock_startup_services() -> Generator[None, None, None]:
    """Replace heavy startup services (ChromaDB, LLMs) with lightweight mocks."""

    mock_workflow = MagicMock()
    mock_workflow.run = AsyncMock(return_value={
        "rewritten_query": "test query",
        "strategy": {
            "key_regulations": ["GDPR"],
            "business_opportunities": ["SaaS"],
            "marketing_strategy": ["Content marketing"],
            "compliance_checklist": ["Register with authorities"],
            "implementation_roadmap": ["Month 1: research"],
        },
        "retrieved_sources": ["https://eur-lex.europa.eu"],
        "pdf_report": "data/reports/test.pdf",
    })

    mock_blog_service = MagicMock()
    mock_blog_service.list_posts.return_value = []
    mock_blog_service.get_post.return_value = None

    mock_container = MagicMock()
    mock_container.workflow = mock_workflow

    with (
        patch("app.rag.chroma_store.ChromaRegulationStore.__init__", return_value=None),
        patch("app.rag.chroma_store.ChromaRegulationStore._get_embedding_model", return_value=MagicMock()),
        patch("app.agents.gemini_client.GeminiClient.__init__", return_value=None),
    ):
        yield


@pytest.fixture(scope="session")
def client(mock_startup_services: None) -> Generator[TestClient, None, None]:
    """Return a synchronous TestClient with mocked heavy services."""

    from app.main import app

    app.state.container = MagicMock()
    app.state.blog_service = MagicMock()
    app.state.blog_service.list_posts.return_value = []
    app.state.blog_service.get_post.return_value = None
    app.state.api_prefix = "/api/ai/internal"
    app.state.settings = MagicMock()

    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture
def auth_headers() -> dict[str, str]:
    return {"x-app-password": "test-password"}
