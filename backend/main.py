"""Compatibility entrypoint that delegates to the app package FastAPI instance."""

from app.main import app

__all__ = ["app"]
