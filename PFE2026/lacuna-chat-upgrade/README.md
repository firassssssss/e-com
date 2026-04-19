# LACUNA Chat Upgrade — Drop-in Package
## LACUNA PFE 2026

Complete SSE streaming chatbot with:
- Token-by-token streaming (Ollama mistral-nemo:12b)
- Semantic RAG search (nomic-embed-text via Ollama → ChromaDB)
- Redis rate limiting (20 msg/60s) + skin profile cache (2h TTL)
- Conversation history (last 3 turns from PostgreSQL)
- Order lookup by regex → raw SQL
- Thumbs up/down feedback system
- Auto-sync on every product mutation

---

## File Map — Where Each File Goes

```
lacuna-chat-upgrade/
│
├── src/api/controllers/
│   ├── ChatController.ts          → PFE2026/src/api/controllers/
│   └── ChatFeedbackController.ts  → PFE2026/src/api/controllers/
│
├── src/api/middlewares/
│   └── serviceAuthMiddleware.ts   → PFE2026/src/api/middlewares/
│
├── src/infrastructure/db/schema/
│   ├── conversationLogs.ts        → PFE2026/src/infrastructure/db/schema/
│   └── chatFeedback.ts            → PFE2026/src/infrastructure/db/schema/
│
├── src/main_autosync_snippet.ts   → paste into PFE2026/src/main.ts
│
├── frontend/hooks/
│   └── useChat.ts                 → PFE2026/frontend2/hooks/  (create folder)
│
├── frontend/app/api/chat/message/
│   └── route.ts                   → PFE2026/frontend2/app/api/chat/message/
│
├── frontend2/components/site/chatbot/
│   └── ChatbotWidget.tsx          → PFE2026/frontend2/components/site/chatbot/
│
├── rag/rag_service/
│   ├── main.py                    → rag/rag_service/main.py
│   └── requirements.txt           → rag/rag_service/requirements.txt
│
└── drizzle/migrations/
    └── 0005_chat_system.sql       → PFE2026/drizzle/migrations/
```

---

## Setup Order

### 1. Ollama models
```powershell
ollama pull mistral-nemo:12b
ollama pull nomic-embed-text
```

### 2. DB migration
```powershell
cd PFE2026
psql $env:DATABASE_URL -f drizzle/migrations/0005_chat_system.sql
```

### 3. .env (add to PFE2026/.env)
```
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral-nemo:12b
RAG_URL=http://localhost:8001
RASA_SERVICE_TOKEN=<generate below>
REDIS_URL=redis://localhost:6379
```

Generate token:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. RAG service
```powershell
cd rag/rag_service
pip install -r requirements.txt
uvicorn main:app --port 8001 --reload
```

### 5. Ingest products (first time only)
```powershell
curl -X POST http://localhost:8001/reindex -H "Authorization: Bearer <your_token>"
```

### 6. Start Express + Next.js as normal
```powershell
cd PFE2026
npm run dev
```

---

## Quick Reference — All Constants

| Constant | Value | Location |
|---|---|---|
| OLLAMA_MODEL | mistral-nemo:12b | ChatController.ts |
| EMBED_MODEL | nomic-embed-text | rag/main.py |
| HISTORY_LIMIT | 3 turns | ChatController.ts |
| RAG_TIMEOUT | 5 000ms | ChatController.ts |
| STREAM_TIMEOUT_MS | 45 000ms | ChatController.ts |
| SKIN_CACHE_TTL | 7 200s (2h) | ChatController.ts |
| RATE_MAX_MSGS | 20 | ChatController.ts |
| RATE_WINDOW_SEC | 60 | ChatController.ts |
| MAX_MSG_LENGTH | 500 chars | route.ts |
| EMBED_CONCURRENCY | 4 | rag/main.py |
