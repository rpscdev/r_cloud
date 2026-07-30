"""FastAPI entrypoint for EU Market Strategy AI backend."""

from __future__ import annotations

import logging
from logging.config import dictConfig
from time import perf_counter

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.agents.compliance_analyzer import ComplianceAnalyzerAgent
from app.agents.gemini_client import GeminiClient
from app.agents.opportunity_extractor import OpportunityExtractionAgent
from app.agents.query_rewriter import QueryRewriterAgent
from app.agents.strategy_generator import StrategyGeneratorAgent
from app.api.routes.balloon import router as balloon_router
from app.api.routes.blog import router as blog_router
from app.api.routes.strategy import router as strategy_router
from app.blog.service import MarkdownBlogService
from app.core.config import get_settings
from app.core.container import AppContainer
from app.core.rate_limit import limiter
from app.crawler.tavily_crawler import RegulationCrawler
from app.observability.metrics import HTTP_REQUEST_COUNT, HTTP_REQUEST_LATENCY_SECONDS
from app.pdf.report_service import PDFReportService
from app.rag.chroma_store import ChromaRegulationStore
from app.rag.ingest import RegulationIngestionService
from app.workflows.strategy_graph import StrategyWorkflow

settings = get_settings()


def configure_logging() -> None:
    """Configure process-wide structured logging."""

    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "structured": {
                    "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
                }
            },
            "handlers": {
                "default": {
                    "class": "logging.StreamHandler",
                    "formatter": "structured",
                }
            },
            "root": {
                "handlers": ["default"],
                "level": settings.log_level.upper(),
            },
        }
    )


configure_logging()
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.app_name)
app.state.limiter = limiter

# Serve git-backed blog images from repository content folder.
settings.resolved_blog_images_dir.mkdir(parents=True, exist_ok=True)
app.mount("/images", StaticFiles(directory=str(settings.resolved_blog_images_dir)), name="blog-images")
app.mount("/api/images", StaticFiles(directory=str(settings.resolved_blog_images_dir)), name="blog-images-api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "x-app-password", "Authorization"],
)
app.add_middleware(SlowAPIMiddleware)


@app.middleware("http")
async def prometheus_middleware(request: Request, call_next):
    """Collect per-request Prometheus metrics."""

    started_at = perf_counter()
    status_code = 500

    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    finally:
        endpoint = request.url.path
        HTTP_REQUEST_COUNT.labels(
            request.method,
            endpoint,
            str(status_code),
        ).inc()
        HTTP_REQUEST_LATENCY_SECONDS.labels(request.method, endpoint).observe(perf_counter() - started_at)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Attach baseline security headers to all responses."""

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.enable_hsts or settings.app_env.lower() == "production":
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    return response


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Return sanitized validation errors without internal traces."""

    sanitized_errors = [
        {
            "loc": error.get("loc", []),
            "msg": error.get("msg", "Invalid input."),
            "type": error.get("type", "value_error"),
        }
        for error in exc.errors()
    ]

    logger.info("Validation error on %s: %s", request.url.path, sanitized_errors)
    return JSONResponse(status_code=422, content={"detail": sanitized_errors})


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    """Return expected HTTP errors with stable shape."""

    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RateLimitExceeded)
async def rate_limit_exception_handler(_: Request, __: RateLimitExceeded) -> JSONResponse:
    """Return JSON response for rate-limited requests."""

    return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded. Try again later."})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch unexpected errors and avoid leaking stack traces to clients."""

    logger.exception("Unhandled error on %s", request.url.path, exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.on_event("startup")
def startup_event() -> None:
    """Initialize shared services once when API starts."""

    store = ChromaRegulationStore(settings)
    ingestion = RegulationIngestionService(settings, store)
    crawler = RegulationCrawler(settings)

    llm_client = GeminiClient(settings)
    query_rewriter = QueryRewriterAgent(llm_client)
    compliance_analyzer = ComplianceAnalyzerAgent(llm_client)
    opportunity_extractor = OpportunityExtractionAgent(llm_client)
    strategy_generator = StrategyGeneratorAgent(llm_client)

    workflow = StrategyWorkflow(
        store=store,
        query_rewriter=query_rewriter,
        compliance_analyzer=compliance_analyzer,
        opportunity_extractor=opportunity_extractor,
        strategy_generator=strategy_generator,
        context_char_limit=settings.strategy_context_char_limit,
    )

    # Pre-load embedding model so first request does not trigger a slow download.
    store._get_embedding_model()

    report_service = PDFReportService(settings)
    blog_service = MarkdownBlogService(settings)

    app.state.container = AppContainer(
        crawler=crawler,
        ingestion=ingestion,
        workflow=workflow,
        report_service=report_service,
    )
    app.state.blog_service = blog_service
    app.state.api_prefix = settings.api_prefix
    app.state.settings = settings
    logger.info("EU strategy services initialized. API prefix: %s", settings.api_prefix)


@app.get("/health", tags=["system"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/metrics", include_in_schema=False)
def metrics() -> Response:
    """Expose Prometheus metrics endpoint."""

    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


app.include_router(blog_router)
app.include_router(balloon_router)
app.include_router(strategy_router, prefix=settings.api_prefix)
