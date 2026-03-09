"""Shared typed objects for RAG ingestion and retrieval."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class RegulationChunk:
    """A single chunk of regulation text and metadata."""

    chunk_id: str
    text: str
    source_url: str
    source_document: str
    regulation_type: str
