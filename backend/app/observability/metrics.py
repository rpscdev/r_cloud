"""Prometheus metrics definitions and helpers."""

from __future__ import annotations

from contextlib import contextmanager
from time import perf_counter
from typing import Iterator

from prometheus_client import Counter, Histogram

HTTP_REQUEST_COUNT = Counter(
    "eu_market_http_requests_total",
    "Total HTTP requests handled by the API.",
    ["method", "endpoint", "status_code"],
)

HTTP_REQUEST_LATENCY_SECONDS = Histogram(
    "eu_market_http_request_latency_seconds",
    "HTTP request latency by endpoint.",
    ["method", "endpoint"],
    buckets=(0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10),
)

LLM_INFERENCE_TIME_SECONDS = Histogram(
    "eu_market_llm_inference_seconds",
    "Latency of Gemini calls by agent.",
    ["agent"],
    buckets=(0.1, 0.25, 0.5, 1, 2, 3, 5, 8, 13, 21),
)

VECTOR_RETRIEVAL_TIME_SECONDS = Histogram(
    "eu_market_vector_retrieval_seconds",
    "Latency of Chroma vector retrieval.",
    buckets=(0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2),
)

PDF_GENERATION_TIME_SECONDS = Histogram(
    "eu_market_pdf_generation_seconds",
    "Time required to generate strategy PDFs.",
    buckets=(0.1, 0.2, 0.5, 1, 2, 3, 5, 8),
)

REGULATION_PDFS_COLLECTED_TOTAL = Counter(
    "eu_market_regulation_pdfs_collected_total",
    "Total number of regulation PDFs collected by crawler.",
)

REGULATION_CHUNKS_INGESTED_TOTAL = Counter(
    "eu_market_regulation_chunks_ingested_total",
    "Total number of regulation chunks ingested into ChromaDB.",
)


@contextmanager
def observe_duration(histogram: Histogram, *labels: str) -> Iterator[None]:
    """Observe execution duration for a code block."""

    started_at = perf_counter()
    try:
        yield
    finally:
        duration = perf_counter() - started_at
        if labels:
            histogram.labels(*labels).observe(duration)
        else:
            histogram.observe(duration)
