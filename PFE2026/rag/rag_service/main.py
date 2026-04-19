import os, logging
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import chromadb

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Lacuna RAG Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

OLLAMA_URL       = os.getenv("OLLAMA_URL",       "http://localhost:11434")
EMBED_MODEL      = os.getenv("EMBED_MODEL",      "nomic-embed-text")
COLLECTION_NAME  = os.getenv("COLLECTION_NAME",  "lacuna_products")
API_BASE         = os.getenv("API_BASE",         "http://localhost:3000")
SERVICE_TOKEN    = os.getenv("RASA_SERVICE_TOKEN", "")

# -- ChromaDB --------------------------------------------------
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(
    name=COLLECTION_NAME,
    metadata={"hnsw:space": "cosine"}
)

# -- Helpers ---------------------------------------------------
def embed(text: str) -> list[float]:
    r = httpx.post(f"{OLLAMA_URL}/api/embed",
                   json={"model": EMBED_MODEL, "input": text}, timeout=30.0)
    r.raise_for_status()
    return r.json()["embeddings"][0]

def fetch_products() -> list[dict]:
    headers = {"Authorization": f"Bearer {SERVICE_TOKEN}"}
    r = httpx.get(f"{API_BASE}/api/products", headers=headers, timeout=30.0)
    r.raise_for_status()
    data = r.json()
    return data if isinstance(data, list) else data.get("data", [])

# -- Endpoints -------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "vectors": collection.count()}

@app.get("/search")
def search(q: str, limit: int = 4):
    if not q.strip() or collection.count() == 0:
        return {"results": []}
    try:
        results = collection.query(
            query_embeddings=[embed(q)],
            n_results=min(limit, collection.count()),
            include=["documents", "metadatas"]
        )
        output = []
        for i, doc in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i] if results.get("metadatas") else {}
            output.append({
                "name":        meta.get("name", ""),
                "description": doc,
                "category":    meta.get("category", ""),
                "price":       meta.get("price", ""),
                "id":          meta.get("id", ""),
            })
        return {"results": output}
    except Exception as e:
        logger.error(f"Search error: {e}")
        return {"results": []}

@app.post("/sync")
def sync():
    try:
        products = fetch_products()
        if not products:
            return {"synced": 0}
        ids, docs, metas = [], [], []
        for p in products:
            pid = str(p.get("id", ""))
            if not pid:
                continue
            name = str(p.get("name", ""))
            desc = str(p.get("description", ""))
            cat  = p.get("category", {})
            cat_name = cat.get("name", "") if isinstance(cat, dict) else str(cat)
            ids.append(pid)
            skin_types = " ".join(p.get("skinType", []) or []); ingredients = " ".join((p.get("ingredients", []) or [])[:5]); docs.append(f"{name} {desc} {skin_types} {ingredients}".strip())
            metas.append({"id": pid, "name": name, "category": cat_name,
                          "price": str(p.get("price", ""))})
        # Upsert in batches of 10
        for i in range(0, len(ids), 10):
            b_ids   = ids[i:i+10]
            b_docs  = docs[i:i+10]
            b_metas = metas[i:i+10]
            collection.upsert(ids=b_ids, documents=b_docs, metadatas=b_metas,
                              embeddings=[embed(d) for d in b_docs])
        logger.info(f"Synced {len(ids)} products")
        return {"synced": len(ids)}
    except Exception as e:
        logger.error(f"Sync error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reindex")
def reindex():
    try:
        chroma_client.delete_collection(COLLECTION_NAME)
        global collection
        collection = chroma_client.get_or_create_collection(
            name=COLLECTION_NAME, metadata={"hnsw:space": "cosine"})
        return sync()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

