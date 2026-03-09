"""Text chunking utilities for regulation documents."""

from __future__ import annotations


def chunk_text_by_words(text: str, chunk_size: int = 500, overlap: int = 80) -> list[str]:
    """Split text into overlapping word chunks suitable for embedding."""

    words = text.split()
    if not words:
        return []

    if overlap >= chunk_size:
        overlap = max(1, chunk_size // 4)

    step = max(1, chunk_size - overlap)
    chunks: list[str] = []

    for idx in range(0, len(words), step):
        chunk_words = words[idx : idx + chunk_size]
        if not chunk_words:
            continue
        chunk = " ".join(chunk_words).strip()
        if chunk:
            chunks.append(chunk)

    return chunks
