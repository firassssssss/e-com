# LUMINA — Architecture Guide

## Overview

LUMINA is a full-stack e-commerce platform built on Clean Architecture principles. The codebase is split into three independent services:

- **Backend** (`PFE2026/`) — Node.js + TypeScript + Express
- **Frontend** (`frontend2/`) — Next.js 14 (App Router)
- **RAG Service** (`PFE2026/rag/rag_service/`) — Python + FastAPI + ChromaDB

---

## Backend Layer Structure

```
src/
├── core/           # Zero external dependencies — pure business logic
├── adapters/       # Bridges between core and infrastructure
├── infrastructure/ # All external concerns (DB, Redis, queues, email)
├── api/            # HTTP layer (controllers, middlewares, DTOs)
└── config/         # DI container, OpenAPI setup
```

### Rule: Dependency Direction

```
api → core ← adapters ← infrastructure
```

`core` never imports from `infrastructure`, `adapters`, or `api`.
If you need to add a new feature, the interface goes in `core`, the implementation goes in `infrastructure`.

---

## Core Layer (`src/core/`)

Contains only:
- **Entities** — domain objects (`User`, `Order`, `Product`, etc.)
- **Use Cases** — one file per business operation
- **Repository interfaces** — `IOrderRepository`, `IProductRepository`, etc.
- **Service interfaces** — `IEmailService`, `IPaymentService`, etc.
- **Domain events** — event definitions only, no handling logic
- **Errors** — typed domain errors

No framework imports. No `express`, no `drizzle`, no `redis` here.

---

## Infrastructure Layer (`src/infrastructure/`)

Contains all concrete implementations:
- **`db/`** — Drizzle ORM + PostgreSQL schema and migrations
- **`queue/`** — BullMQ event queue backed by Redis
- **`events/listeners/`** — concrete event handlers (see Event System below)
- **`services/`** — Nodemailer, Firebase, Stripe stub, RAG HTTP client
- **`redis/`** — Redis client instance
- **`security/`** — audit logger

---

## Event System

This is the most important architectural piece to understand.

### Flow

```
Use Case
  └─► emits DomainEvent
        └─► BullMQEventEmitter (infrastructure/queue)
              └─► eventsQueue (Redis-backed)
                    └─► eventsWorker picks up job
                          └─► EventRegistry.dispatch()
                                └─► Listener.handle()
                                      └─► side effect (email, notification, DB write)
```

### Where Listeners Live

**`src/infrastructure/events/listeners/`** — this is the correct location.
These are concrete listeners that have infrastructure dependencies (Redis, email service, DB).

**`src/core/listeners/`** — contains interface-level listener definitions.
The `index.ts` here wires up which listeners exist. Concrete implementations delegate to infrastructure.

> **Important for new devs:** When adding a new domain event, create:
> 1. The event class in `src/core/events/`
> 2. The listener interface/registration in `src/core/listeners/`
> 3. The concrete handler in `src/infrastructure/events/listeners/`
> 4. Register in `src/infrastructure/events/EventRegistry.ts`

---

## API Layer (`src/api/`)

### Middleware Stack (order matters)

```
1. Sentry init
2. CORS (reads FRONTEND_URL)
3. CSP nonce → Helmet
4. Body parsing (JSON, urlencoded)
5. Sanitize middleware (XSS layer 1)
6. Better Auth (brute force intercept on sign-in)
7. OTP rate limiter
8. Request context + Morgan logging
9. Admin TOTP enforcement
10. Routing controllers (all /api routes)
11. BullMQ dashboard (/admin/queues) — Basic Auth protected
12. OpenAPI docs (/docs)
13. RAG auto-sync (fires on product mutations)
14. Error handler (must be last)
```

### Auth Flow

- Authentication is handled by **Better Auth** at `/api/auth/*`
- JWT tokens contain a `jti` (UUID v4) claim
- Logout blacklists the `jti` in Redis with TTL = token remaining lifetime
- Every protected request checks Redis blacklist before proceeding
- Admin routes additionally enforce TOTP

---

## RAG Service (`rag/rag_service/`)

Standalone Python FastAPI service. Runs separately from the Node backend.

- Embeddings stored in ChromaDB
- Model: Ollama (configurable via `OLLAMA_MODEL`)
- Backend calls it via `RagHttpsClient.ts` with mTLS + Bearer token auth
- Auto-sync triggered on every successful product POST/PUT/PATCH/DELETE

### Key env vars for RAG
```
RAG_URL=           # FastAPI service URL
RAG_SERVICE_TOKEN= # Shared Bearer token
OLLAMA_URL=        # Ollama instance
OLLAMA_MODEL=      # e.g. mistral-nemo:12b
```

---

## Frontend (`frontend2/`)

Next.js 14 App Router. Two route groups:

- **`(site)/`** — customer-facing pages (home, products, cart, checkout, orders, wishlist)
- **`admin/`** — admin dashboard (analytics, orders, products, users, chat health, graph)

State management: Zustand (`authStore`), Redux for some slices.
API calls: Axios via `lib/api.ts`.
Theme: CSS variables, dark/light toggle, aurora animation background.

---

## Key Environment Variables

| Variable | Used By | Required |
|---|---|---|
| `DATABASE_URL` | Drizzle ORM | Yes |
| `REDIS_URL` | BullMQ, rate limiter, token blacklist | Yes |
| `JWT_SECRET` | JwtService | Yes |
| `BETTER_AUTH_SECRET` | Better Auth | Yes |
| `RAG_URL` | RagHttpsClient, auto-sync | Yes |
| `RAG_SERVICE_TOKEN` | RAG auth + BullMQ dashboard password | Yes |
| `FRONTEND_URL` | CORS origin | Yes |
| `OLLAMA_URL` | RAG service | Yes |
| `SMTP_*` | Nodemailer email | Yes |
| `FIREBASE_BUCKET_NAME` | Storage | Yes |
| `SENTRY_DSN` | Error tracking | Optional |
| `BYPASS_OTP` | Dev only — skip OTP | Dev only |

---

## Adding a New Feature — Checklist

1. Define entity changes in `src/core/entities/`
2. Add/update repository interface in `src/core/repositories/`
3. Write use case in `src/core/usecases/`
4. Implement repository in `src/adapters/repositories/`
5. Add controller + DTOs in `src/api/`
6. Register controller in `src/api/controllers/index.ts`
7. Register repository in `src/config/Containers/AppContainers.ts`
8. If it emits events: add event in `src/core/events/`, listener in `src/infrastructure/events/listeners/`, register in `EventRegistry.ts`
9. Run `npm run db:migrate` if schema changed
