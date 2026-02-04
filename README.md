# raghvendra.cloud

Personal portfolio website with a React frontend, FastAPI backend, and a weather dashboard powered by Open-Meteo. Deployed behind Nginx with Docker Compose.

## Features
- React + Vite frontend with routes for Home, AI Models, Blog, and Weather Dashboard
- FastAPI backend with JWT-protected blog CRUD
- SQLite database via SQLModel
- Umami analytics
- Nginx reverse proxy with HTTPS support

## Tech Stack
- Frontend: React 19, Vite, TypeScript
- Backend: FastAPI, SQLModel, SQLAlchemy
- Infra: Docker, Nginx
- Analytics: Umami Cloud

## Project Structure
- `frontend/` React app
- `backend/` FastAPI app
- `nginx/` Nginx config
- `docker-compose.yml` multi-service setup

## Routes
- `/` Home
- `/models` AI model cards
- `/models/wether-dashbord` Weather dashboard
- `/blog` Blog + admin panel

## Environment Variables
Create `backend/.env` with:
```
SECRET_KEY=your_secret
ADMIN_USERNAME=your_admin
ADMIN_HASHED_PASSWORD=your_bcrypt_hash
```

## Local Development
### Backend
```
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```
cd frontend
npm install
npm run dev
```

## Docker (Production)
Build and run all services:
```
docker compose up -d --build
```

Check logs:
```
docker compose logs -f backend
```

## Nginx Notes
- Proxies `/` to the React app
- Proxies `/api` to the FastAPI backend
- SPA fallback for React Router

## Analytics (Umami)
The Umami script is loaded in `frontend/index.html`. Route changes are tracked in `frontend/src/App.tsx`.

## Weather Dashboard
Uses Open-Meteo API and the Open-Meteo geocoding API. No API key required.


