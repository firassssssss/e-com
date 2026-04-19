"""
rag/rag_service/main.py — LACUNA PFE 2026
==========================================
FastAPI RAG microservice.

Endpoints:
  GET  /health          — liveness probe
  GET  /search          — semantic product search (called by ChatController)
  POST /sync            — upsert changed products into ChromaDB (auto-sync)
  POST /reindex         — drop + full rebuild (first setup / corruption recovery)

Embedding model : nomic-embed-text (via Ollama)
Vector store    : ChromaDB HNSW (persisted to ./chroma_db/)
Auth            : Bearer RASA_SERVICE_TOKEN on /sync and /reindex only

Install:
  pip install fastapi uvicorn chromadb httpx python-dotenv
Run:
  uvicorn rag_service.main:app --host 0.0.0.0 --port 8001 --reload
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Optional

import chromadb
import httpx
from fastapi import FastAPI, HTTPException, Query, Request, Depends
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
OLLAMA_URL       = os.getenv("OLLAMA_URL",          "http://localhost:11434")
EMBED_MODEL      = os.getenv("EMBED_MODEL",          "nomic-embed-text")
CHROMA_PATH      = os.getenv("CHROMA_PATH",          "./chroma_db")
COLLECTION_NAME  = os.getenv("COLLECTION_NAME",      "lacuna_products")
API_BASE         = os.getenv("EXPRESS_API_URL",      "http://localhost:3000")
SERVICE_TOKEN    = os.getenv("RASA_SERVICE_TOKEN",   "")
EMBED_CONCURRENCY = 4   # parallel embed calls during sync

API_HEADERS = {
    "Authorization": f"Bearer {SERVICE_TOKEN}",
    "Content-Type":  "application/json",
}

# ── Globals ───────────────────────────────────────────────────────────────────
_chroma_client:     Optional[chromadb.PersistentClient] = None
_collection:        Optional[chromadb.Collection]        = None


# ── Embed via Ollama ──────────────────────────────────────────────────────────
async def embed(text: str) -> list[float]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{OLLAMA_URL}/api/embeddings",
            json={"model": EMBED_MODEL, "prompt": text},
        )
        resp.raise_for_status()
        return resp.json()["embedding"]


# ── Fetch products from Express ───────────────────────────────────────────────
async def _fetch_active_products() -> list[dict]:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(f"{API_BASE}/api/products", headers=API_HEADERS)
        resp.raise_for_status()
        data = resp.json()
        # Handle both {data: [...]} and [...] shapes
        return data.get("data", data) if isinstance(data, dict) else data


# ── Build document string for a product ──────────────────────────────────────
def _product_doc(p: dict) -> str:
    return " ".join(filter(None, [
        str(p.get("name",        "")),
        str(p.get("brand",       "")),
        str(p.get("description", "")),
        str(p.get("skin_type",   "")),
        str(p.get("concern",     "")),
        str(p.get("ingredients", "")),
    ])).strip()


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _chroma_client, _collection
    _chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    _collection    = _chroma_client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )
    logger.info("RAG service ready — collection: %s  docs: %d",
                COLLECTION_NAME, _collection.count())
    yield


app = FastAPI(title="LACUNA RAG Service", lifespan=lifespan)


# ── Auth dependency (for mutation endpoints) ──────────────────────────────────
def require_service_token(request: Request):
    if not SERVICE_TOKEN:
        raise HTTPException(500, "Server misconfiguration: service token not set")
    auth = request.headers.get("Authorization", "")
    token = auth.removeprefix("Bearer ").strip()
    if token != SERVICE_TOKEN:
        raise HTTPException(401, "Invalid or missing service token")


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "docs": _collection.count() if _collection else 0}


@app.get("/search")
async def search(
    q:     str = Query(..., min_length=1, max_length=500),
    limit: int = Query(4,  ge=1, le=20),
):
    """Semantic product search — called by ChatController every message."""
    if not _collection:
        raise HTTPException(503, "Collection not ready")

    query_embedding = await embed(q)
    results         = _collection.query(
        query_embeddings=[query_embedding],
        n_results=min(limit, _collection.count() or 1),
        include=["metadatas", "distances"],
    )

    products     = []
    has_oos      = False
    metadatas    = results["metadatas"][0]
    distances    = results["distances"][0]

    for meta, dist in zip(metadatas, distances):
        if meta.get("in_stock") is False:
            has_oos = True
        products.append({
            **meta,
            "similarity": round(1.0 - dist, 4),
        })

    return {"results": products, "has_oos_fallback": has_oos}


@app.post("/sync", dependencies=[Depends(require_service_token)])
async def sync():
    """
    Upsert all active products into ChromaDB.
    Fast — only changed products need re-embedding.
    Called automatically by the auto-sync middleware on every product mutation.
    """
    if not _collection:
        raise HTTPException(503, "Collection not ready")

    products = await _fetch_active_products()
    if not products:
        return {"synced": 0}

    import asyncio

    async def embed_product(p: dict) -> tuple[str, list[float], dict]:
        doc       = _product_doc(p)
        embedding = await embed(doc)
        meta      = {
            "product_id": str(p.get("id",         "")),
            "name":       str(p.get("name",        "")),
            "brand":      str(p.get("brand",       "")),
            "price":      float(p.get("price",     0)),
            "image_url":  str(p.get("image_url",   "")),
            "skin_type":  str(p.get("skin_type",   "")),
            "concern":    str(p.get("concern",     "")),
            "avg_rating": float(p.get("avg_rating", 0)),
            "in_stock":   bool(p.get("in_stock",   True)),
        }
        return str(p["id"]), embedding, meta

    # Process in batches of EMBED_CONCURRENCY
    semaphore = asyncio.Semaphore(EMBED_CONCURRENCY)

    async def bounded(p):
        async with semaphore:
            return await embed_product(p)

    results = await asyncio.gather(*[bounded(p) for p in products])

    ids        = [r[0] for r in results]
    embeddings = [r[1] for r in results]
    metadatas  = [r[2] for r in results]

    _collection.upsert(ids=ids, embeddings=embeddings, metadatas=metadatas)
    logger.info("[RAG] /sync — upserted %d products", len(ids))

    return {"synced": len(ids)}


@app.post("/reindex", dependencies=[Depends(require_service_token)])
async def reindex():
    """
    Drop + full rebuild from scratch.
    Use only for first setup or index corruption.
    Causes downtime — no results during rebuild.
    """
    global _collection

    if not _chroma_client:
        raise HTTPException(503, "Chroma not ready")

    # Drop existing collection
    try:
        _chroma_client.delete_collection(COLLECTION_NAME)
        logger.info("[RAG] /reindex — dropped collection")
    except Exception:
        pass

    _collection = _chroma_client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    # Re-run sync logic
    sync_result = await sync()
    logger.info("[RAG] /reindex complete — %d docs", sync_result["synced"])
    return {"reindexed": sync_result["synced"]}
