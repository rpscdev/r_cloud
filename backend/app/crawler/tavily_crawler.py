"""Crawler that discovers and downloads regulation PDFs using Tavily + HTML parsing."""

from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from app.core.config import Settings
from app.observability.metrics import REGULATION_PDFS_COLLECTED_TOTAL

logger = logging.getLogger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)


@dataclass(slots=True)
class DownloadedPDF:
    """Represents one downloaded PDF file from official regulation sources."""

    source_url: str
    local_path: Path


@dataclass(slots=True)
class TavilyDocument:
    """One textual regulation source discovered via Tavily."""

    source_url: str
    title: str
    text: str


class RegulationCrawler:
    """Discovers and downloads regulation PDFs from trusted sources."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._download_dir = Path(settings.regulation_download_dir)
        self._download_dir.mkdir(parents=True, exist_ok=True)

    async def collect_pdf_links(self, query: str, max_results: int) -> list[str]:
        """Discover candidate PDF links from Tavily search and source HTML pages."""

        async with self._new_client() as client:
            search_items = await self._tavily_search(client=client, query=query, max_results=max_results)
            pdf_links: set[str] = set()

            for item in search_items:
                url = item.get("url", "")
                if not url:
                    continue
                if self._is_allowed_domain(url) and url.lower().endswith(".pdf"):
                    pdf_links.add(url)
                    continue

                for pdf_url in await self._extract_pdf_links_from_page(client, url):
                    if self._is_allowed_domain(pdf_url):
                        pdf_links.add(pdf_url)

        return sorted(pdf_links)

    async def collect_tavily_documents(self, query: str, max_results: int) -> list[TavilyDocument]:
        """Collect textual regulation context directly from Tavily results."""

        async with self._new_client() as client:
            response_items = await self._tavily_search(client=client, query=query, max_results=max_results)

        documents: list[TavilyDocument] = []
        for item in response_items:
            source_url = item.get("url", "")
            if not source_url or not self._is_allowed_domain(source_url):
                continue

            raw_content = (item.get("raw_content") or "").strip()
            snippet = (item.get("content") or "").strip()
            text = raw_content or snippet
            if not text:
                continue

            documents.append(
                TavilyDocument(
                    source_url=source_url,
                    title=(item.get("title") or "").strip(),
                    text=text,
                )
            )

        return documents

    async def download_pdfs(self, urls: list[str]) -> list[DownloadedPDF]:
        """Download remote PDFs to local storage with size checks."""

        downloaded: list[DownloadedPDF] = []

        async with self._new_client() as client:
            for url in urls:
                if not self._is_allowed_domain(url):
                    continue

                try:
                    response = await client.get(url, follow_redirects=True)
                    response.raise_for_status()
                except httpx.HTTPError as exc:
                    logger.warning("Failed to download %s: %s", url, exc)
                    continue

                content_type = response.headers.get("Content-Type", "").lower()
                if "pdf" not in content_type and not url.lower().endswith(".pdf"):
                    logger.debug("Skipping non-PDF response from %s", url)
                    continue

                content = response.content
                if len(content) > self._settings.max_pdf_size_bytes:
                    logger.warning("Skipping oversized PDF (%s bytes) from %s", len(content), url)
                    continue

                filename = self._make_filename(url)
                local_path = self._download_dir / filename
                local_path.write_bytes(content)
                downloaded.append(DownloadedPDF(source_url=url, local_path=local_path))
                REGULATION_PDFS_COLLECTED_TOTAL.inc()

        return downloaded

    def _new_client(self) -> httpx.AsyncClient:
        timeout = httpx.Timeout(self._settings.tavily_timeout_seconds)
        return httpx.AsyncClient(
            timeout=timeout,
            headers={"User-Agent": USER_AGENT},
        )

    async def _tavily_search(self, client: httpx.AsyncClient, query: str, max_results: int) -> list[dict]:
        payload = {
            "api_key": self._settings.tavily_api_key,
            "query": query,
            "search_depth": "advanced",
            "max_results": max_results,
            "include_answer": False,
            "include_images": False,
            "include_raw_content": True,
        }
        response = await client.post("https://api.tavily.com/search", json=payload)
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, dict):
            return []
        return data.get("results", []) or []

    async def _extract_pdf_links_from_page(self, client: httpx.AsyncClient, page_url: str) -> list[str]:
        if not self._is_allowed_domain(page_url):
            return []

        try:
            response = await client.get(page_url, follow_redirects=True)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            logger.debug("Skipping page %s due to fetch error: %s", page_url, exc)
            return []

        soup = BeautifulSoup(response.text, "html.parser")
        links: list[str] = []

        for anchor in soup.find_all("a", href=True):
            href = anchor["href"].strip()
            absolute = urljoin(page_url, href)
            if absolute.lower().endswith(".pdf"):
                links.append(absolute)

        return links

    def _is_allowed_domain(self, url: str) -> bool:
        domain = urlparse(url).netloc.lower()
        if not domain:
            return False
        return any(domain.endswith(allowed) for allowed in self._settings.allowed_domain_list)

    @staticmethod
    def _make_filename(url: str) -> str:
        digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
        return f"regulation_{digest}.pdf"
