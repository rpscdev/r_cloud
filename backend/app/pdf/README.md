Place local regulation PDFs in this folder.

Rules enforced by backend:
- `.pdf` files only
- max file size from `MAX_PDF_SIZE_MB` (default: 20 MB)

These files are ingested into ChromaDB by calling:
- `POST /api/ai/internal/collect-regulations`
