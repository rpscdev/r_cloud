"""FastAPI routes for regulation collection and strategy generation."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse

from app.auth import verify_access
from app.core.container import AppContainer
from app.core.rate_limit import limiter
from app.schemas.strategy import (
    CollectRegulationsRequest,
    CollectRegulationsResponse,
    StrategyRequest,
    StrategyResponse,
)

router = APIRouter(tags=["eu-market-strategy"], dependencies=[Depends(verify_access)])


def _get_container(request: Request) -> AppContainer:
    container = getattr(request.app.state, "container", None)
    if container is None:
        raise HTTPException(status_code=500, detail="Application services are not initialized.")
    return container


@router.get("/access-check")
async def access_check() -> dict[str, bool]:
    """Validate route password without triggering expensive workflows."""

    return {"ok": True}


@router.post("/collect-regulations", response_model=CollectRegulationsResponse)
@limiter.limit("5/minute")
async def collect_regulations(request: Request, payload: CollectRegulationsRequest) -> CollectRegulationsResponse:
    """Discover regulation sources and ingest content into ChromaDB."""

    container = _get_container(request)
    ingested_chunks = 0
    sources: set[str] = set()

    tavily_documents = await container.crawler.collect_tavily_documents(payload.query, payload.max_results)
    for doc in tavily_documents:
        inserted = await run_in_threadpool(
            container.ingestion.ingest_text,
            text=doc.text,
            source_url=doc.source_url,
            source_document=doc.title or doc.source_url,
            regulation_type="tavily-regulation",
        )
        if inserted:
            ingested_chunks += inserted
            sources.add(doc.source_url)

    discovered_pdf_urls = await container.crawler.collect_pdf_links(payload.query, payload.max_results)
    downloaded_pdfs = await container.crawler.download_pdfs(discovered_pdf_urls)
    for downloaded in downloaded_pdfs:
        inserted = await run_in_threadpool(container.ingestion.ingest_pdf, downloaded.local_path, downloaded.source_url)
        if inserted:
            ingested_chunks += inserted
            sources.add(downloaded.source_url)

    local_dir = Path(request.app.state.settings.local_regulation_pdfs_dir)
    local_dir.mkdir(parents=True, exist_ok=True)
    local_docs = sorted(
        path for path in local_dir.iterdir() if path.is_file() and path.suffix.lower() == ".pdf"
    )

    local_documents_ingested = 0
    for local_doc in local_docs:
        inserted = await run_in_threadpool(container.ingestion.ingest_local_pdf_document, local_doc)
        if inserted:
            ingested_chunks += inserted
            local_documents_ingested += 1
            sources.add(f"local://{local_doc.name}")

    return CollectRegulationsResponse(
        discovered_pdf_urls=len(discovered_pdf_urls),
        downloaded_pdfs=len(downloaded_pdfs),
        ingested_chunks=ingested_chunks,
        tavily_documents_ingested=len(tavily_documents),
        local_documents_ingested=local_documents_ingested,
        sources=sorted(sources),
    )


@router.post("/generate-strategy", response_model=StrategyResponse)
@limiter.limit("5/minute")
async def generate_strategy(request: Request, payload: StrategyRequest) -> StrategyResponse:
    """Run LangGraph workflow and return structured strategy with PDF report."""

    container = _get_container(request)
    state = await container.workflow.arun(payload.business_idea)

    strategy = state.get("strategy")
    if strategy is None:
        raise HTTPException(status_code=502, detail="Strategy generation failed.")

    sources = sorted({chunk.source_url for chunk in state.get("retrieved_chunks", [])})
    report_path = await run_in_threadpool(
        container.report_service.generate_report,
        query=payload.business_idea,
        market_focus=payload.market_focus,
        strategy=strategy,
        sources=sources,
    )

    report_filename = Path(report_path).name
    api_prefix = getattr(request.app.state, "api_prefix", "") or ""
    report_url = f"{api_prefix}/reports/{report_filename}" if api_prefix else f"/reports/{report_filename}"

    return StrategyResponse(
        query=payload.business_idea,
        rewritten_query=state.get("rewritten_query", payload.business_idea),
        strategy=strategy,
        retrieved_sources=sources,
        pdf_report=report_url,
    )


@router.get("/reports/{filename}")
async def download_report(filename: str, request: Request) -> FileResponse:
    """Serve generated strategy report PDF."""

    if Path(filename).name != filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    container = _get_container(request)
    report_dir = Path(container.report_service.output_dir)
    file_path = report_dir / filename

    if not file_path.exists() or not file_path.is_file() or file_path.suffix.lower() != ".pdf":
        raise HTTPException(status_code=404, detail="Report not found")

    return FileResponse(file_path, media_type="application/pdf", filename=filename)
