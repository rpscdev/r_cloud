"""Cloud Run entrypoint: FastAPI API plus the compiled React SPA.

All API routes are registered on the app imported from ``app.main`` first.
The catch-all SPA route below is registered last so it never shadows them.
"""

from pathlib import Path

from fastapi import HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.main import app

FRONTEND_DIST = Path(__file__).resolve().parent / "frontend_dist"
INDEX_FILE = FRONTEND_DIST / "index.html"

if FRONTEND_DIST.is_dir():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="spa-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str) -> FileResponse:
        """Serve a built static file, or fall back to index.html for client-side routes."""

        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")

        candidate = (FRONTEND_DIST / full_path).resolve()
        if candidate.is_file() and candidate.is_relative_to(FRONTEND_DIST):
            return FileResponse(candidate)
        return FileResponse(INDEX_FILE)

__all__ = ["app"]
