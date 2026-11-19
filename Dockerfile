# ---- Stage 1: build the React/Vite frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: FastAPI runtime serving API + SPA ----
FROM python:3.11-slim
WORKDIR /app/backend

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libcairo2 \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
# requirements.txt pulls CPU-only PyTorch via the extra index
RUN pip install --no-cache-dir -r requirements.txt

# Bake the embedding model into the image so Cloud Run never downloads it at runtime
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY backend/ ./
COPY --from=frontend-build /frontend/dist ./frontend_dist

EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --forwarded-allow-ips='*'"]
