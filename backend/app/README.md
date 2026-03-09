# Backend API

## Run locally

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Required environment variables (`backend/.env`)

- `GEMINI_API_KEY`
- `TAVILY_API_KEY`
- `APP_ACCESS_PASSWORD`
- `GEMINI_MODEL` (optional, default `gemini-2.5-flash`)
- `API_PREFIX` (optional, default `/api/ai/internal`)
- `CORS_ORIGINS` (frontend origins only)
- `BLOG_CONTENT_DIR` (default `content/blog`)
- `BLOG_IMAGES_DIR` (default `content/images`)
- `LOCAL_REGULATION_PDFS_DIR` (default `data/regulation_pdfs`)

## Blog API (git + markdown)

- `GET /posts/?limit=4`
- `GET /posts/`
- `GET /posts/{slug}`
- `GET /api/images/{filename}`

## Protected AI endpoints

All AI endpoints require request header:

- `x-app-password: <APP_ACCESS_PASSWORD>`

Endpoints:

- `POST /api/ai/internal/collect-regulations`
- `POST /api/ai/internal/generate-strategy`
- `GET /api/ai/internal/reports/{filename}`

## Rate limiting

Sensitive AI routes are limited to `5 requests/minute` per IP.

## Prometheus metrics exposed

- `eu_market_http_requests_total`
- `eu_market_http_request_latency_seconds`
- `eu_market_llm_inference_seconds`
- `eu_market_vector_retrieval_seconds`
- `eu_market_pdf_generation_seconds`
- `eu_market_regulation_pdfs_collected_total`
- `eu_market_regulation_chunks_ingested_total`
