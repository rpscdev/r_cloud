# raghvendra.cloud

[![Tests](https://github.com/rpscdev/r_cloud/actions/workflows/test.yml/badge.svg)](https://github.com/rpscdev/r_cloud/actions/workflows/test.yml)
[![Deploy](https://github.com/rpscdev/r_cloud/actions/workflows/deploy.yml/badge.svg)](https://github.com/rpscdev/r_cloud/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Personal portfolio website with a React frontend, FastAPI backend, AI-powered EU Market Strategy analysis, a markdown blog, weather dashboard, and full observability stack. Deployed behind Nginx with Docker Compose.

## Features

- **EU Market Strategy AI** — multi-agent LangGraph workflow (query rewriter → compliance analyzer → opportunity extractor → strategy generator) backed by a ChromaDB RAG system over EU regulations, with downloadable PDF reports
- **Blog** — markdown-file-based blog with hot-reload; no database needed, git-backed
- **Weather Dashboard** — powered by Open-Meteo (no API key required)
- **Observability** — Prometheus metrics + Grafana dashboards
- **Nginx reverse proxy** with HTTPS/SSL, rate limiting, and SPA fallback

## Architecture

```
Browser
  └── Nginx (TLS termination, rate limiting, SPA fallback)
        ├── /                → React SPA (static files)
        └── /api/ai/internal → FastAPI backend
                                  ├── LangGraph workflow
                                  │     ├── QueryRewriter   ──┐
                                  │     ├── ComplianceAnalyzer├─ Groq LLM (llama-3.1-8b-instant)
                                  │     ├── OpportunityExtractor
                                  │     └── StrategyGenerator─┘
                                  ├── ChromaDB (RAG vector store)
                                  │     └── sentence-transformers embeddings
                                  ├── Tavily API (regulation web crawl)
                                  └── WeasyPrint (PDF report generation)

Monitoring: Prometheus ← FastAPI /metrics → Grafana dashboards
```

**Request flow for EU Market Strategy:**
1. Frontend POSTs `{ business_idea, market_focus }` with `x-app-password` header
2. Nginx proxies to FastAPI (`proxy_read_timeout 300s` for long LLM chains)
3. `QueryRewriter` rewrites the query for semantic search
4. ChromaDB retrieves relevant EU regulation chunks
5. `ComplianceAnalyzer` → `OpportunityExtractor` → `StrategyGenerator` each call Groq sequentially
6. WeasyPrint generates a PDF report; path returned in JSON response

## Quick Start

```bash
# 1. Clone and configure
git clone https://github.com/rpscdev/r_cloud.git && cd r_cloud
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit both .env files with your API keys

# 2. Start everything
docker compose up -d --build

# 3. Open http://localhost
```

Services after startup:

| Service | URL |
|---------|-----|
| Website | http://localhost |
| API docs | http://localhost/api/docs |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, TypeScript, react-router-dom |
| Backend | FastAPI, Pydantic v2, python-dotenv |
| AI / RAG | LangGraph, ChromaDB, sentence-transformers, Groq (llama-3.1-8b-instant) |
| Web search | Tavily API |
| PDF reports | WeasyPrint + Jinja2 |
| Infra | Docker Compose, Nginx (Alpine) |
| Monitoring | Prometheus, Grafana |
| Analytics | Umami Cloud |

## Project Structure

```
r_cloud/
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── pages/     # Blog, BlogPost, EUMarketStrategy, WeatherDashboard, …
│       └── components/
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── agents/    # LLM agent clients
│   │   ├── api/       # REST endpoints
│   │   ├── blog/      # Markdown blog service
│   │   ├── crawler/   # Tavily regulation crawler
│   │   ├── pdf/       # PDF report generation
│   │   ├── rag/       # ChromaDB vector store
│   │   └── workflows/ # LangGraph strategy workflow
│   ├── content/       # Blog markdown files (volume-mounted, git-backed)
│   ├── data/          # ChromaDB embeddings + PDF reports (volume-mounted)
│   └── tests/         # pytest test suite
├── nginx/             # Reverse proxy config
├── monitoring/        # Prometheus + Grafana config
└── docker-compose.yml
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Home |
| `/models` | AI model cards |
| `/models/eu-market-strategy-ai` | EU Market Strategy AI tool |
| `/models/weather-dashboard` | Weather dashboard |
| `/blog` | Blog listing |
| `/blog/:slug` | Individual blog post |

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your values:

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API key (get one at console.groq.com) |
| `TAVILY_API_KEY` | Yes | Tavily search API key |
| `APP_ACCESS_PASSWORD` | Yes | Password protecting the AI endpoints |
| `GROQ_MODEL` | No | Default: `llama-3.1-8b-instant` |
| `STRATEGY_CONTEXT_CHAR_LIMIT` | No | Default: `6000` (stay within Groq free tier) |

Copy `frontend/.env.example` to `frontend/.env`:

| Variable | Description |
|----------|-------------|
| `VITE_STRATEGY_API_BASE_URL` | API base path (default: `/api/ai/internal`) |
| `VITE_APP_ACCESS_PASSWORD` | Must match `APP_ACCESS_PASSWORD` in backend |

## Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

## Running Locally (without Docker)

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Deployment (VPS)

```bash
git pull
docker compose up -d --build
```

Blog posts in `backend/content/` are volume-mounted — after `git pull`, new posts are live without rebuilding containers.

## Nginx Notes

- Proxies `/` → React SPA (with `try_files` fallback for client-side routing)
- Proxies `/api` → FastAPI backend
- AI endpoints have `proxy_read_timeout 300s` to accommodate multi-agent LLM chains
- Rate limiting applied to `/api/ai/` routes

## License

[MIT](LICENSE) © Raghvendra Pratap Singh
