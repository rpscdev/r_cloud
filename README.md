# raghvendra.cloud

Personal portfolio website with a React frontend, FastAPI backend, AI-powered EU Market Strategy analysis, a markdown blog, weather dashboard, and full observability stack. Deployed behind Nginx with Docker Compose.

## Features

- **EU Market Strategy AI** — multi-agent LangGraph workflow (query rewriter → compliance analyzer → opportunity extractor → strategy generator) backed by a ChromaDB RAG system over EU regulations, with downloadable PDF reports
- **Blog** — markdown-file-based blog with hot-reload; no database needed, git-backed
- **Weather Dashboard** — powered by Open-Meteo (no API key required)
- **Observability** — Prometheus metrics + Grafana dashboards
- **Nginx reverse proxy** with HTTPS/SSL, rate limiting, and SPA fallback

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, TypeScript, react-router-dom |
| Backend | FastAPI, Pydantic, SQLModel |
| AI / RAG | LangGraph, ChromaDB, sentence-transformers, Groq (llama-3.1-8b-instant) |
| Web search | Tavily API |
| PDF reports | WeasyPrint |
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
│   ├── content/       # Blog markdown files (volume-mounted)
│   └── data/          # SQLite DB + embeddings cache (volume-mounted)
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
| `/models/wether-dashbord` | Weather dashboard |
| `/blog` | Blog listing |
| `/blog/:slug` | Individual blog post |

## Environment Variables

Create `backend/.env`:

```env
# Auth(/This is old version currently no in use due to removal of sql data base/)
SECRET_KEY=your_secret_key
ADMIN_USERNAME=your_admin
ADMIN_HASHED_PASSWORD=your_bcrypt_hash
APP_ACCESS_PASSWORD=your_app_password

# Groq LLM
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.1-8b-instant
GROQ_TIMEOUT_SECONDS=90
GROQ_MAX_OUTPUT_TOKENS=4096

# Tavily (web search for regulation crawler)
TAVILY_API_KEY=tvly-...

# Optional tuning
STRATEGY_CONTEXT_CHAR_LIMIT=6000
```

## Running Locally (Docker)

```bash
docker compose up -d --build
```

Services:
- Site → `http://localhost` (Nginx)
- API → `http://localhost/api`
- Prometheus → `http://localhost:9090`
- Grafana → `http://localhost:3000`

Check backend logs:

```bash
docker compose logs -f backend
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

Blog posts in `backend/content/` are volume-mounted, so after `git pull` new posts are live without rebuilding containers.

## Nginx Notes

- Proxies `/` → React SPA (with `try_files` fallback for client-side routing)
- Proxies `/api` → FastAPI backend
- AI endpoints have `proxy_read_timeout 300s` to accommodate multi-agent LLM chains
- Rate limiting applied to `/api/ai/` routes
