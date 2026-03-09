"""Ingestion pipeline for regulation PDF documents and Tavily text."""

from __future__ import annotations

import hashlib
import logging
import re
from pathlib import Path

from pypdf import PdfReader

from app.core.config import Settings
from app.observability.metrics import REGULATION_CHUNKS_INGESTED_TOTAL
from app.rag.chunker import chunk_text_by_words
from app.rag.chroma_store import ChromaRegulationStore
from app.rag.types import RegulationChunk

logger = logging.getLogger(__name__)


def infer_regulation_type(source_url: str) -> str:
    """Infer regulation category from source URL."""

    lowered = source_url.lower()
    if "gdpr" in lowered or "data" in lowered or "privacy" in lowered:
        return "data-protection"
    if "ai" in lowered:
        return "ai-regulation"
    if "esg" in lowered or "sustain" in lowered:
        return "esg"
    if "startup" in lowered or "grant" in lowered:
        return "startup-support"
    return "general-regulation"


def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract plain text from a PDF file safely."""

    try:
        reader = PdfReader(str(pdf_path))
    except Exception as exc:  # noqa: BLE001
        logger.warning("Unable to read PDF %s: %s", pdf_path, exc)
        return ""

    pages: list[str] = []
    for page in reader.pages:
        try:
            pages.append(page.extract_text() or "")
        except Exception as exc:  # noqa: BLE001
            logger.debug("Skipping unreadable page in %s: %s", pdf_path, exc)

    merged = "\n".join(pages)
    return re.sub(r"\s+", " ", merged).strip()


class RegulationIngestionService:
    """Transforms documents into vectorized chunks in ChromaDB."""

    def __init__(self, settings: Settings, store: ChromaRegulationStore) -> None:
        self._settings = settings
        self._store = store

    def ingest_pdf(self, pdf_path: Path, source_url: str) -> int:
        """Parse PDF, chunk text, and persist in Chroma."""

        if not self._is_safe_pdf(pdf_path):
            return 0

        text = extract_text_from_pdf(pdf_path)
        if not text:
            logger.warning("Skipping empty PDF: %s", pdf_path)
            return 0

        regulation_type = infer_regulation_type(source_url)
        return self.ingest_text(
            text=text,
            source_url=source_url,
            source_document=pdf_path.name,
            regulation_type=regulation_type,
        )

    def ingest_text(
        self,
        *,
        text: str,
        source_url: str,
        source_document: str,
        regulation_type: str = "general-regulation",
    ) -> int:
        """Chunk arbitrary text and persist into Chroma."""

        normalized = re.sub(r"\s+", " ", text).strip()
        if not normalized:
            return 0

        chunks = chunk_text_by_words(
            normalized,
            chunk_size=self._settings.chunk_size_words,
            overlap=self._settings.chunk_overlap_words,
        )

        prepared_chunks: list[RegulationChunk] = []
        for index, chunk_text in enumerate(chunks):
            prepared_chunks.append(
                RegulationChunk(
                    chunk_id=self._chunk_id(source_url, source_document, chunk_text, index),
                    text=chunk_text,
                    source_url=source_url,
                    source_document=source_document,
                    regulation_type=regulation_type,
                )
            )

        inserted = self._store.add_chunks(prepared_chunks)
        if inserted:
            REGULATION_CHUNKS_INGESTED_TOTAL.inc(inserted)
        return inserted

    def ingest_local_pdf_document(self, file_path: Path) -> int:
        """Ingest local PDF document from configured local regulation folder."""

        if not self._is_safe_pdf(file_path):
            return 0

        source_url = f"local://{file_path.name}"
        return self.ingest_pdf(file_path, source_url)

    def _is_safe_pdf(self, file_path: Path) -> bool:
        if not file_path.exists() or not file_path.is_file():
            logger.warning("Skipping missing file: %s", file_path)
            return False

        if file_path.suffix.lower() != ".pdf":
            logger.warning("Skipping unsupported file type: %s", file_path)
            return False

        size = file_path.stat().st_size
        if size <= 0:
            logger.warning("Skipping empty file: %s", file_path)
            return False

        if size > self._settings.max_pdf_size_bytes:
            logger.warning(
                "Skipping oversized PDF %s (%s bytes > %s bytes)",
                file_path,
                size,
                self._settings.max_pdf_size_bytes,
            )
            return False

        return True

    @staticmethod
    def _chunk_id(source_url: str, source_document: str, chunk_text: str, index: int) -> str:
        payload = f"{source_url}|{source_document}|{index}|{chunk_text}".encode("utf-8", errors="ignore")
        return hashlib.sha256(payload).hexdigest()
