"""Dependency container for runtime services."""

from __future__ import annotations

from dataclasses import dataclass

from app.crawler.tavily_crawler import RegulationCrawler
from app.pdf.report_service import PDFReportService
from app.rag.ingest import RegulationIngestionService
from app.workflows.strategy_graph import StrategyWorkflow


@dataclass(slots=True)
class AppContainer:
    """Holds initialized singletons used by API routes."""

    crawler: RegulationCrawler
    ingestion: RegulationIngestionService
    workflow: StrategyWorkflow
    report_service: PDFReportService
