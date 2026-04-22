# LUMINA — AI-Powered Beauty E-Commerce Platform

> A luxury beauty platform built with a clean architecture backend, a Next.js storefront, and a fully local AI stack — no external AI APIs required for the core experience.

---

## What Is Lumina?

Lumina is a full-stack e-commerce platform designed specifically for beauty and skincare. It goes far beyond a standard shop by building a live intelligence layer around each user:

- It **learns your skin type, concerns, and hair type** from your profile and from what you say to the chatbot
- It **tracks every interaction** (views, searches, wishlist adds, cart adds) and uses them to score products
- It **finds similar users** with the same skin type and boosts products they responded to
- It **semantically searches** your product catalog using local AI embeddings
- It **streams AI beauty advice** through a luxury chatbot called **Lumière**, powered entirely by a local Ollama model

Everything runs on your own machine. No OpenAI. No Pinecone. No external vector DB.

---

## System Architecture

Three services must run simultaneously:

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   LUMINA Frontend (Next.js 14)       → http://localhost:3001    ║
║   ┌─────────────────────────────┐                               ║
║   │ /app/(site)/    storefront  │                               ║
║   │ /app/admin/     dashboard   │                               ║
║   │ /app/api/chat/  SSE proxy   │──────────────────────┐        ║
║   └─────────────────────────────┘                      │        ║
║                                                        ▼        ║
║   PFE2026 Backend (Express 5 + TS)   → http://localhost:3000   ║
║   ┌─────────────────────────────┐                               ║
║   │ Better Auth + JWT           │                               ║
║   │ Clean Architecture          │                               ║
║   │ Domain Events + BullMQ      │──────────────────────┐        ║
║   │ Drizzle ORM + PostgreSQL    │                       │        ║
║   └─────────────────────────────┘                      ▼        ║
║                                                                  ║
║   RAG Service (FastAPI + Python)     → http://localhost:8001   ║
║   ┌─────────────────────────────┐                               ║
║   │ ChromaDB vector store       │                               ║
║   │ Ollama nomic-embed-text     │                               ║
║   │ /search  /sync  /reindex    │                               ║
║   └─────────────────────────────┘                               ║
║                                                                  ║
║   Infrastructure: PostgreSQL · Redis · Ollama (local)           ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Backend + Frontend |
| Python | 3.11+ | RAG service |
| PostgreSQL | 14+ | Main database |
| Redis | 6+ | Queue + chat rate limiting + skin cache |
| Ollama | latest | Local AI (embeddings + LLM) |

### Install Ollama and pull the two required models

```bash
# Pull the embedding model (used by RAG service)
ollama pull nomic-embed-text

# Pull the LLM (used by the chatbot)
ollama pull mistral-nemo:12b
```

> `mistral-nemo:12b` is a 7 GB download. It runs fully locally — no API key needed.

---

## Installation

```bash
git clone https://github.com/firassssssss/e-com.git
cd e-com
```

### 1. Backend
```bash
cd PFE2026
npm install
```

### 2. Frontend
```bash
cd frontend2
npm install
```

### 3. RAG Service
```bash
cd PFE2026/rag/rag_service

python -m venv .venv

# Windows PowerShell:
.venv\Scripts\activate
# Mac / Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

---

## Environment Variables

### `PFE2026/.env`

```bash
cp PFE2026/.env.example PFE2026/.env
```

```env
APP_NAME=Lumina
APP_VERSION=1.0.0

# PostgreSQL
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/lumina"

# Redis (optional for basic use — needed for background workers and chat rate-limiting)
# REDIS_URL="redis://localhost:6379"

# JWT — any long random string
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d

# OTP — set BYPASS_OTP=true during local development
BYPASS_OTP=true
BYPASS_OTP_CODE=000000
PRELUDE_API_KEY=your_prelude_key  # only needed in production

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Firebase (optional — for product image uploads)
FIREBASE_BUCKET_NAME=your_bucket.appspot.com
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# AI (optional — for enhanced responses beyond Ollama)
ANTHROPIC_API_KEY=your_key
PERPLEXITY_API_KEY=your_key

# Better Auth
BETTER_AUTH_SECRET=another_random_secret
BETTER_AUTH_URL=http://localhost:3000

# RAG microservice — MUST match the token in the RAG .env
RASA_SERVICE_TOKEN=pick_any_secret_token
RAG_URL=http://localhost:8001

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=mistral-nemo:12b
```

### `PFE2026/rag/rag_service/.env`

```env
OLLAMA_URL=http://localhost:11434
EMBED_MODEL=nomic-embed-text
COLLECTION_NAME=lacuna_products
API_BASE=http://localhost:3000
RASA_SERVICE_TOKEN=pick_any_secret_token   # same value as above
```

### `frontend2/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
EXPRESS_API_URL=http://localhost:3000
```

---

## Running Lumina

Open **4 terminal windows**:

### Terminal 1 — Verify infrastructure
```bash
# Check PostgreSQL
psql -U postgres -c "\l"

# Check Redis
redis-cli ping   # should return PONG

# Check Ollama
ollama list      # should show mistral-nemo:12b and nomic-embed-text
```

### Terminal 2 — Backend API
```bash
cd PFE2026
npm run db:migrate      # run once to create all tables
npm run dev             # starts on http://localhost:3000
```

### Terminal 3 — Frontend
```bash
cd frontend2
npm run dev             # starts on http://localhost:3001
```

### Terminal 4 — RAG Service
```bash
cd PFE2026/rag/rag_service
.venv\Scripts\activate         # Windows
# source .venv/bin/activate    # Mac/Linux
uvicorn main:app --reload --port 8001
```

### Terminal 5 (optional) — Background Event Worker
Needed for email notifications, stock alerts, wishlist analytics:
```bash
cd PFE2026
npm run events:worker:dev
```

After starting everything, **seed the chatbot** with your products:
```bash
curl -X POST http://localhost:8001/sync
```

---

## Database Setup

```bash
cd PFE2026

# Create the database (once)
psql -U postgres -c "CREATE DATABASE lumina;"

# Run all migrations
npm run db:migrate

# Browse the schema visually in the browser
npm run db:studio
```

---

## The Intelligence System — How Recommendations Work

This is the core of Lumina. It is not a simple product list — there is a 4-layer scoring engine that runs for every logged-in user.

### Layer 1 — Signal Tracking

Every meaningful action a user takes is recorded as a **signal** with a weight:

| Action | Signal Type | Weight |
|---|---|---|
| Views a product page | `view` | 1 |
| Searches for something | `search` | 2 |
| Adds to wishlist | `wishlist` | 3 |
| Adds to cart | `cart` | 4 |

These signals accumulate in the `user_signals` table. A product a user adds to cart five times has a raw signal score of 20, directly boosting it in their feed. The frontend fires these automatically through `useSignal.ts` + `signalsApi.track()` — invisible to the user.

### Layer 2 — Content-Based Filtering

The engine reads the user's profile: `skinType`, `skinConcerns`, `hairType`. It scores every active product in the catalog:

```
+4    product.skinType[] includes user's skin type
+2    each concern keyword match in product name/description
+1    each hair keyword match
+0.5 × averageRating    quality boost
```

Concern keywords mapped precisely:

| Concern | Keywords matched in product text |
|---|---|
| acne | acne, blemish, salicylic, breakout, pore, antibacterial |
| aging | anti-age, retinol, collagen, firming, wrinkle |
| dullness | radiance, glow, brightening, vitamin c, luminous |
| hyperpigmentation | dark spot, niacinamide, depigment |
| dehydration | hydrat, moistur, hyaluronic, water |
| redness | calm, sooth, sensitive, rosacea, aloe |

### Layer 3 — Collaborative Filtering

The system finds users who share the same `skinType` and examines which products they added to wishlist or cart (weight ≥ 3 only — strong intent). Those products receive a collaborative boost:

```
+2 × count_of_similar_users_who_signaled    (capped at +3 total)
```

### Layer 4 — RAG Semantic Boost

The recommendation engine calls the RAG service with the user's profile as a natural language query (`"oily acne vitamin c"`). The RAG service embeds this with Ollama and finds the most semantically similar products in ChromaDB. Each result gets:

```
+3    semantic relevance boost
```

### Final Score Formula

```
score = skin_type_match (0 or 4)
      + Σ concern_keyword_matches (2 each)
      + Σ hair_keyword_matches (1 each)
      + averageRating × 0.5
      + min(my_signal_score, 5)
      + min(collab_score × 2, 3)
      + rag_boost (0 or 3)
```

Products sorted descending, top N returned.

---

## The Chatbot — Lumière (LUMINA Beauty Advisor)

The AI persona is named **Lumière** in the system prompt and displayed as **LUMINA Beauty Advisor** in the UI.

### Full Message Flow

```
User types message in ChatbotWidget
          │
          ▼
POST /api/chat/message   (Next.js proxy route)
  → validates: max 500 chars, non-empty
  → validates sessionId format (regex, max 128 chars)
  → strips malformed sessionId → "anon"
  → forwards cookies + Authorization header to Express
          │
          ▼
POST /api/chat/message   (Express ChatController)
  Step 1: Rate limit check
          → Redis INCR chat_rate:{userId|sessionId}
          → max 20 messages per 60 seconds
          → keyed by verified userId (cannot be spoofed via body)

  Step 2: Load conversation history
          → SELECT last 3 turns from conversation_logs
          → scoped by userId (auth users — cross-session memory)
          → scoped by sessionId (anonymous users — session only)

  Step 3: Load skin profile from DB
          → reads skinType, skinConcern from users table

  Step 4: Skin signal extraction from message
          → regex scan for oily/dry/combination/normal/sensitive
          → keyword scan for 17 concern terms (acne, redness, aging...)
          → merged with Redis skin cache (TTL 2 hours)
          → result stored back to Redis

  Step 5: Order lookup
          → detects "ORD-xxxx" patterns or "order number: xxxx" in message
          → queries orders table, returns status + total + tracking number

  Step 6: RAG product search
          → builds query: "user message + skin type + top 2 concerns"
          → GET {RAG_URL}/search?q=...&limit=6 with 5s timeout
          → returns up to 6 semantically matching products

  Step 7: Build system prompt
          → BASE_PROMPT: "You are Lumière, a friendly beauty advisor..."
          → + skin context: "Skin: oily. Concerns: acne, dehydration."
          → + order context: "Order ORD-xxx: Status pending, 89 TND"
          → + PERMITTED PRODUCTS: the RAG results only
          → If RAG empty: "ZERO RESULTS - FORBIDDEN from naming products"

  Step 8: Sanitize user message (prompt injection guard)
          → strips [INST]/[/INST]/<<SYS>> (Llama instruction tokens)
          → strips lines starting with "system:", "assistant:", "user:"

  Step 9: Call Ollama /api/chat
          → model: mistral-nemo:12b
          → messages: [system, ...history, user]
          → stream: true → 45s timeout

  Step 10: Stream tokens via SSE
          → each Ollama chunk → parse → sseChunk({token: "..."})
          → frontend appends token to message text in real time

  Step 11: Save to DB
          → INSERT into conversation_logs (sessionId, userId, userMessage, botMessages JSON)

  Step 12: Send completion
          → sseChunk({done: true, logId: "..."})
          → frontend unlocks feedback buttons
          │
          ▼
User can rate the response:
  POST /api/chat/feedback → {logId, rating: 1|-1} → chat_feedback table
```

### Skin Signal Extraction (Real-Time)

Every message the user sends is scanned automatically:

```
"my skin gets really oily and I have acne and redness"

→ detected type:     "oily"
→ detected concerns: ["acne", "redness"]
→ merged with Redis skin cache + DB profile
→ RAG query becomes: "oily acne redness moisturizer serum"
→ chatbot now recommends products matching this exact profile
```

The chatbot becomes progressively smarter about the user within the same conversation — no form required.

### Prompt Injection Protection

User messages are sanitized before reaching the LLM. The model is also constrained at the prompt level — it is told it may only name products from the explicitly provided list. If the RAG service returns nothing, the prompt says `ZERO RESULTS - FORBIDDEN from naming products`, preventing the model from hallucinating product names.

### Conversation Memory

| User Type | History Scope | Persistence |
|---|---|---|
| Authenticated | `userId` | Cross-session, cross-device |
| Anonymous | `sessionId` | Browser session only |

Last 3 turns (6 messages: 3 user + 3 bot) are injected into every Ollama call for context continuity.

---

## Frontend Architecture

### Design Language

Lumina uses a luxury dark aesthetic built from raw CSS variables and inline styles:

| Token | Value | Usage |
|---|---|---|
| Background | `#0D0A05` | Deep near-black warm base |
| Primary accent | `#FF5F1F` | Burnt orange — CTAs, glow, send button |
| Secondary accent | `#23D5D5` | Cyan — positive feedback, highlights |
| Warm glow | `rgba(255,200,120,0.14)` | Card hover illumination |
| Display font | Cormorant Garamond (serif) | Headlines, product names |
| Label font | Syncopate (geometric) | Uppercase tracking labels |
| Body font | DM Sans | UI text, chat messages |

### 3D Crystal Product Cards

The `RecommendedProducts` component renders product cards with a physics-inspired 3D tilt. This is **not** CSS hover transitions — it is a `requestAnimationFrame` loop running at 60fps with lerp-smoothed mouse tracking. Zero React re-renders happen per frame — all DOM mutations go through refs:

```
MouseMove event → updates target position (tx, ty) as 0..1 fractions

RAF tick every frame:
  mx = lerp(mx, tx, 0.1)   ← smooth at 10% per frame (exponential decay)
  my = lerp(my, ty, 0.1)

  dx = mx - 0.5            ← -0.5 to +0.5 from center
  dy = my - 0.5

  card.style.transform =
    "rotateX(" + (-dy × 16) + "deg) "    ← vertical tilt
    "rotateY(" + (dx × 20) + "deg) "     ← horizontal tilt
    "scale(" + (hovered ? 1.03 : 1) + ")"

  imgWrapper.style.transform =
    "translate(" + (dx × 10) + "px, " + (dy × 8) + "px)"    ← parallax depth

  glowDiv.style.background =
    "radial-gradient(ellipse at " + (46 + dx×22) + "% " + (38 + dy×18) + "%, ...)"
```

The image wrapper is sized at 110% with -5% margin so the parallax translation never exposes a gap at edges. The `perspective: 900px` is set on the outer container, not the card itself, so the 3D origin is stable.

### Infinite Marquee

Recommended products carousel: the product array is duplicated, then a CSS `@keyframes` animation scrolls the doubled list continuously. CSS `animation-play-state: paused` on hover stops it without JavaScript.

### State Management

| State | Tool | Notes |
|---|---|---|
| Auth user + token | Zustand (`useAuthStore`) | Persisted, shared across components |
| Chat messages | React `useState` | Local to ChatbotWidget |
| Streaming bot text | React `useState` via `patchMsg` | Mutated token by token |
| Skin signals | Fire and forget | `useSignal.ts` → `signalsApi.track()` |

### API Client (`frontend2/lib/api.ts`)

Single Axios instance with:
- `baseURL`: Express backend (`http://localhost:3000`)
- `withCredentials: true`: sends Better Auth cookies
- Request interceptor: reads JWT from `localStorage`, attaches `Authorization: Bearer` header

Domain-grouped exports: `productsApi`, `cartApi`, `ordersApi`, `wishlistApi`, `reviewsApi`, `authApi`, `recommendationsApi`, `signalsApi`.

### Chat Proxy Route

`frontend2/app/api/chat/message/route.ts` is a Next.js Route Handler that:
1. Validates the message on the Next.js side (length, format)
2. Forwards the request to Express with the user's cookies and auth header intact
3. Pipes the SSE stream from Express directly to the browser — no buffering

This avoids CORS issues and keeps the Express URL hidden from the browser.

---

## Backend Architecture — Clean Architecture

The backend follows Clean Architecture strictly, with zero framework imports in the business logic layer:

```
PFE2026/src/
├── core/                     ← Pure business logic. Zero Express/Drizzle imports.
│   ├── entities/             ← Domain models: User, Product, Order, Cart, Review...
│   ├── repositories/         ← Interfaces only: IProductRepository, IUserRepository...
│   ├── usecases/             ← One file per use case. Injected by TypeDI.
│   │   ├── product/          ← GetProduct, ListProducts, GetRecommendations, TrackSignal...
│   │   ├── cart/             ← AddToCart, RemoveFromCart, GetCart, ClearCart
│   │   ├── order/            ← Checkout, UpdateOrderStatus, GetOrderStatusHistory
│   │   ├── review/           ← AddReview, ApproveReview, DeleteReview, ListReviews
│   │   ├── wishlist/         ← AddItem, RemoveItem, GetWishlist
│   │   ├── address/          ← AddAddress, UpdateAddress, DeleteAddress, List
│   │   ├── admin/            ← ListUsers, SuspendUser, UpdateRole, GetAnalytics...
│   │   └── user/             ← GetMe, UpdateProfile, DeleteAccount, GetPublicProfile
│   ├── events/               ← Domain events + handlers
│   └── services/             ← Interfaces: IEmailService, IPaymentService, ILogger...
│
├── adapters/                 ← Concrete implementations of core interfaces
│   ├── repositories/         ← Drizzle ORM: ProductRepository, UserRepository...
│   │   └── */mappers/        ← DB row → Domain entity transformations
│   ├── security/             ← ArgonPasswordHasher, BcryptPasswordHasher
│   └── services/             ← LocalizationService, LoggerFactory, RequestScopedLogger
│
├── infrastructure/           ← External connections
│   ├── db/                   ← Drizzle schema + PG connection + migration runner
│   │   └── schema/           ← 16 table definitions
│   ├── queue/                ← BullMQ queue + worker + Redis connection
│   ├── events/               ← EventRegistry + listeners wiring
│   ├── redis/                ← ioredis client singleton
│   ├── security/             ← Audit logger
│   └── services/             ← Firebase (storage + FCM), Stripe, Nodemailer, RAG client
│
└── api/                      ← HTTP layer
    ├── controllers/          ← routing-controllers decorators (@Get, @Post, @Authorized...)
    ├── dtos/                 ← class-validator request body shapes
    ├── middlewares/          ← 12 middleware layers (see Security section)
    └── validators/           ← Custom class-validator decorators (IsFutureDate...)
```

### Dependency Injection

The entire app uses **TypeDI**. Every service, repository, and use case is decorated with `@Service()`. Controllers use `@Inject("IProductRepository")` to receive the concrete implementation registered in `AppContainers.ts`. Swapping a PostgreSQL repository for an in-memory one for tests requires one line change.

### Domain Events

When significant things happen, the domain emits typed events processed asynchronously by BullMQ:

| Event | Triggered when | Handlers |
|---|---|---|
| `UserRegistered` | Sign-up completes | SendWelcomeEmail, CreateWelcomeNotification |
| `OrderPlaced` | Checkout completes | StockCheck, OrderConfirmationEmail |
| `ReviewCreated` | User submits review | ReviewModerationHandler |
| `ReviewApproved` | Admin approves | ReviewApprovedNotification to reviewer |
| `VariantStockLow` | Stock drops below threshold | StockWarningHandler → admin alert |
| `VariantOutOfStock` | Stock hits 0 | OutOfStockAlert notification |
| `ProductAddedToWishlist` | Wishlist add | WishlistAnalyticsHandler |
| `UserSignin` | Login | UserSigninNotification (suspicious login detection) |

Events are processed by the worker started with `npm run events:worker:dev`. The main API never waits for them — fire and forget via BullMQ queue.

### Authentication

Lumina uses **Better Auth** for session management alongside **JWT**:

| Endpoint | Purpose |
|---|---|
| `POST /api/auth/sign-up/email` | Register with email + password |
| `POST /api/auth/sign-in/email` | Login |
| `POST /api/auth/sign-out` | Logout |
| `GET /api/auth/session` | Check current session |

Better Auth handles HTTP-only cookie sessions. JWT is also stored in `localStorage` and sent as Bearer token. Both are checked by `authorizationChecker` on protected routes.

### Security Middleware Stack (in order)

1. **CORS** — only allows `http://localhost:3001`
2. **Helmet** — CSP, HSTS, X-Frame-Options, X-Content-Type
3. **Better Auth handler** — processes `/api/auth/*`
4. **Request Context** — attaches requestId for distributed tracing
5. **Morgan** — HTTP access logs to stdout
6. **Rate Limiter** — per-IP limits on all API routes
7. **Brute Force Guard** — exponential backoff on login endpoint
8. **SSRF Guard** — blocks requests to internal IP ranges
9. **Prompt Injection Guard** — sanitizes chat route inputs
10. **Sanitize Middleware** — strips XSS from all body fields
11. **Token Blacklist** — rejects explicitly invalidated JWTs
12. **TOTP Enforcement** — checks 2FA requirement per user
13. **Error Handler** — last middleware, formats all errors consistently

### RAG Auto-Sync

The backend intercepts all mutating requests to `/api/products` and triggers a background sync to the RAG service after every successful mutation:

```typescript
app.use('/api/products', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode < 400) {
        // fire and forget — does not block the API response
        axios.post(`${RAG_URL}/sync`, {}, { timeout: 120_000, headers: {...} })
      }
    });
  }
  next();
});
```

When an admin creates, updates, or deletes a product, the RAG service automatically re-embeds the full catalog. The chatbot and recommendations always reflect current product state.

---

## RAG Service Deep Dive

The RAG service is a standalone Python FastAPI app with three responsibilities: embed products, store vectors, search semantically.

### How Products Are Embedded

When `/sync` is called:
1. Fetches all products from Express `GET /api/products` using `RASA_SERVICE_TOKEN`
2. For each product builds a text document: `"name description skinTypes ingredients"`
3. Sends each document to `POST {OLLAMA_URL}/api/embed` with `nomic-embed-text`
4. Receives a float vector (768 dimensions)
5. Upserts `{id, document, embedding, metadata}` into ChromaDB in batches of 10
6. Metadata stored per product: `id`, `name`, `category`, `price`

ChromaDB uses **HNSW** (Hierarchical Navigable Small World) with cosine similarity. This allows approximate nearest-neighbor search in sub-millisecond time even with tens of thousands of products.

### Search Flow

When `GET /search?q=oily+acne+serum&limit=6` is called:
1. Embeds the query string with Ollama (`nomic-embed-text`)
2. Queries ChromaDB with cosine similarity against all stored product vectors
3. Returns top N results: `{name, description, category, price, id}`

### RAG Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Returns `{status: "ok", vectors: N}` |
| GET | `/search?q=...&limit=4` | Semantic product search |
| POST | `/sync` | Fetch from API, embed new/changed products |
| POST | `/reindex` | Wipe ChromaDB collection, full re-sync |

---

## Admin Dashboard

Available at `http://localhost:3001/admin/`

| Route | What it shows |
|---|---|
| `/admin/dashboard` | Platform KPIs, recent orders |
| `/admin/dashboard/users` | Full user list with roles and status |
| `/admin/users/[id]` | Individual user — profile, orders, signals |
| `/admin/products` | Product CRUD with variant management and image upload |
| `/admin/analytics` | User activity charts built with Recharts + D3 |
| `/admin/chat` | Chat system health, conversation logs, feedback ratings |
| `/admin/graph` | User relationship and signal interaction graph |
| `/admin/security` | Audit log — all security events from `auditLogger.ts` |

Admin routes require the `admin` role on the user record.

BullMQ queue dashboard (job monitoring, retry failed jobs): `http://localhost:3000/admin/queues`

API documentation (Scalar UI, interactive): `http://localhost:3000/docs`

---

## Database Schema

| Table | Purpose |
|---|---|
| `user` | Auth users — includes `skinType`, `skinConcern`, `hairType` profile fields |
| `session` / `account` | Better Auth session management |
| `products` | Product catalog — images, ingredients, skinType array, isActive |
| `product_variants` | SKUs with stock quantity, size, shade, price override |
| `categories` | Hierarchical tree structure |
| `carts` | User shopping cart items |
| `orders` | Orders — status enum, totalAmount, trackingNumber |
| `order_status_history` | Full timeline of every status change per order |
| `reviews` | Product reviews — rating, comment, approval status |
| `wishlists` / `wishlist_items` | User saved products |
| `addresses` | Delivery addresses per user |
| `user_signals` | Behavioral events: type, productId, weight, timestamp |
| `conversation_logs` | Full chat turns — userMessage + botMessages JSONB array |
| `chat_feedback` | Thumbs up/down per log — logId, sessionId, rating |
| `notifications` | In-app notification inbox per user |
| `device_tokens` | FCM push notification device tokens |
| `reports` | User-reported content with target type enum |

---

## Available Scripts

### Backend (`PFE2026/`)

| Command | What it does |
|---|---|
| `npm run dev` | Start API in watch mode (tsx) |
| `npm run build` | TypeScript compile to `dist/` |
| `npm run start` | Run compiled production build |
| `npm run db:migrate` | Run pending SQL migrations |
| `npm run db:generate` | Generate new migration from schema changes |
| `npm run db:studio` | Open Drizzle Studio in browser |
| `npm run events:worker:dev` | Start BullMQ event worker |
| `npm run test` | Run Jest test suite |

### Frontend (`frontend2/`)

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint check |

---

## Common Issues

**Chatbot says "Beauty advisor is temporarily unavailable"**
→ Ollama is not running or `mistral-nemo:12b` is not pulled.
Run `ollama serve` then `ollama pull mistral-nemo:12b`.

**Recommendations return empty**
→ Either the user has no skin profile set (go to profile and fill it in), or the RAG service has no vectors yet. Run `curl -X POST http://localhost:8001/sync` after adding products.

**RAG sync fails with 401**
→ `RASA_SERVICE_TOKEN` in `PFE2026/.env` does not match the value in `PFE2026/rag/rag_service/.env`. They must be identical.

**CORS error in browser console**
→ Frontend must run on port **3001**. The backend CORS config explicitly only allows that origin.

**"Too many messages. Please wait a moment."**
→ Chat rate limit: 20 messages per 60 seconds per user. Wait one minute.

**Redis connection error on startup**
→ Start Redis first. The main API will still start without it but chat rate-limiting and the event worker will be disabled.

**`ollama pull mistral-nemo:12b` is slow**
→ It is ~7 GB. Normal for a local LLM. Pull once, it is cached permanently.

**Products not appearing in chatbot recommendations**
→ Trigger a manual sync: `curl -X POST http://localhost:8001/sync`
→ Or check the RAG health: `curl http://localhost:8001/health` — vectors count should be > 0.

---

## Tech Stack Summary

| Layer | Technology | Role |
|---|---|---|
| Backend framework | Express 5 + TypeScript | REST API, middleware, routing |
| DI Container | TypeDI | Clean constructor injection |
| ORM | Drizzle ORM | Type-safe SQL queries, migrations |
| Database | PostgreSQL | Relational data + JSONB for flexible fields |
| Auth | Better Auth + JWT | Dual-mode: cookie sessions + Bearer tokens |
| Background jobs | BullMQ + Redis | Async domain event processing |
| Frontend | Next.js 14 (App Router) | SSR, file routing, API proxy routes |
| Styling | Tailwind CSS + inline styles | Utility classes + custom design system |
| Admin UI | MUI (Material UI) | Rich forms and data tables in admin |
| State | Zustand | Lightweight global state (auth, etc.) |
| Forms | React Hook Form + Zod | Type-safe validated forms |
| Charts | Recharts + D3.js | Admin analytics and signal graphs |
| RAG service | FastAPI + ChromaDB | Vector store + semantic search API |
| Embeddings | Ollama nomic-embed-text | 100% local text embeddings |
| LLM | Ollama mistral-nemo:12b | 100% local AI beauty advisor |
| File storage | Firebase Storage | Product image hosting |
| Push notifications | Firebase Cloud Messaging | Mobile push |
| Email | Nodemailer | Transactional emails |
| Payments | Stripe | Checkout and webhooks |
| Chat transport | Server-Sent Events (SSE) | Real-time token streaming |
| API docs | Scalar UI | Auto-generated from controller decorators |
| Queue monitoring | Bull Board | BullMQ job dashboard |
| Password hashing | Argon2 + Bcrypt | Configurable per environment |
