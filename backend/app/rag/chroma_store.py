"""ChromaDB-backed vector retrieval for regulation chunks."""

from __future__ import annotations

import logging
from threading import Lock
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import chromadb
    from sentence_transformers import SentenceTransformer

from app.core.config import Settings
from app.rag.types import RegulationChunk

logger = logging.getLogger(__name__)


class ChromaRegulationStore:
    """Encapsulates Chroma collection and embedding model operations."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._embedding_model_name = settings.embedding_model_name
        self._embedding_model: SentenceTransformer | None = None
        self._embedding_lock = Lock()
        self._chroma_lock = Lock()
        self._client: chromadb.ClientAPI | None = None
        self._collection_obj: chromadb.Collection | None = None

    @property
    def _collection(self) -> chromadb.Collection:
        """Create the Chroma client/collection on first use (thread-safe)."""

        collection = self._collection_obj
        if collection is not None:
            return collection

        with self._chroma_lock:
            if self._collection_obj is None:
                import chromadb

                self._client = chromadb.PersistentClient(path=self._settings.chroma_persist_dir)
                self._collection_obj = self._client.get_or_create_collection(
                    name=self._settings.chroma_collection
                )
                logger.info(
                    "Initialized Chroma collection '%s' in %s",
                    self._settings.chroma_collection,
                    self._settings.chroma_persist_dir,
                )
            return self._collection_obj

    def _get_embedding_model(self) -> SentenceTransformer:
        model = self._embedding_model
        if model is not None:
            return model

        with self._embedding_lock:
            if self._embedding_model is None:
                from sentence_transformers import SentenceTransformer

                logger.info("Loading embedding model '%s'", self._embedding_model_name)
                self._embedding_model = SentenceTransformer(self._embedding_model_name)
            return self._embedding_model

    def add_chunks(self, chunks: list[RegulationChunk]) -> int:
        """Add regulation chunks to Chroma collection."""

        if not chunks:
            return 0

        documents = [chunk.text for chunk in chunks]
        ids = [chunk.chunk_id for chunk in chunks]
        metadatas = [
            {
                "source_url": chunk.source_url,
                "source_document": chunk.source_document,
                "regulation_type": chunk.regulation_type,
            }
            for chunk in chunks
        ]

        embedding_model = self._get_embedding_model()
        embeddings = embedding_model.encode(documents, normalize_embeddings=True).tolist()
        self._collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        return len(chunks)

    def retrieve(self, query: str, n_results: int = 6) -> list[RegulationChunk]:
        """Retrieve relevant regulation chunks from vector store."""

        if self._collection.count() == 0:
            logger.warning("Chroma collection is empty. Run collect-regulations before generate-strategy.")
            return []

        embedding_model = self._get_embedding_model()
        query_embedding = embedding_model.encode([query], normalize_embeddings=True).tolist()

        result = self._collection.query(
            query_embeddings=query_embedding,
            n_results=n_results,
            include=["documents", "metadatas"],
        )

        documents = result.get("documents", [[]])[0]
        metadatas = result.get("metadatas", [[]])[0]
        ids = result.get("ids", [[]])[0]

        retrieved: list[RegulationChunk] = []
        for chunk_id, text, metadata in zip(ids, documents, metadatas):
            metadata = metadata or {}
            retrieved.append(
                RegulationChunk(
                    chunk_id=chunk_id,
                    text=text,
                    source_url=metadata.get("source_url", "unknown"),
                    source_document=metadata.get("source_document", "unknown"),
                    regulation_type=metadata.get("regulation_type", "unknown"),
                )
            )

        return retrieved
