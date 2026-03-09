"""PDF generation service for strategy reports."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML

from app.core.config import Settings
from app.observability.metrics import PDF_GENERATION_TIME_SECONDS, observe_duration
from app.schemas.strategy import StrategyPayload


class PDFReportService:
    """Renders strategy report HTML template and converts it to PDF."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._output_dir = Path(settings.report_output_dir)
        self._output_dir.mkdir(parents=True, exist_ok=True)

        template_dir = Path(__file__).resolve().parent / "templates"
        self._jinja = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape(["html", "xml"]),
        )

    @property
    def output_dir(self) -> Path:
        """Directory where generated PDFs are stored."""

        return self._output_dir

    def generate_report(
        self,
        *,
        query: str,
        market_focus: str,
        strategy: StrategyPayload,
        sources: list[str],
    ) -> str:
        """Generate a consulting-style PDF report and return its path."""

        template = self._jinja.get_template("strategy_report.html")
        html = template.render(
            query=query,
            market_focus=market_focus,
            strategy=strategy,
            sources=sources,
            generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        )

        filename = f"strategy_report_{uuid4().hex[:12]}.pdf"
        output_path = self._output_dir / filename

        with observe_duration(PDF_GENERATION_TIME_SECONDS):
            HTML(string=html).write_pdf(str(output_path))

        return str(output_path)
