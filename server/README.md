# LACUNA — Full-Stack E-Commerce Platform

> **Tech Lead Reference Document** — Every layer, decision, and convention explained.
> Read this before you touch a single file.

---

## Stack at a Glance

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router, RSC, Turbopack) · React 19 · TypeScript |
| **Styling** | Inline styles · Cormorant Garamond · DM Mono · GSAP |
| **State** | Zustand (cart, localStorage persist) · better-auth/react (session) |
| **Backend** | Express 5 · TypeScript · Node.js 22 |
| **Auth** | better-auth (cookie sessions + bearer tokens) |
| **ORM** | Drizzle ORM |
| **Database** | PostgreSQL 17 |
| **Queue** | BullMQ + Redis |
| **Payments** | Stripe (stub — ready to activate) |
| **Push** | Firebase Cloud Messaging |
| **DI** | TypeDI |
| **Validation** | class-validator + class-transformer |
| **API Docs** | Scalar UI (OpenAPI via routing-controllers-openapi) |

---

## Repository Layout

```
express-boilerplate/
├── src/                          # Express backend
│   ├── main.ts                   # Entry point — boots Express, registers everything
│   ├── api/                      # HTTP boundary
│   │   ├── controllers/          # routing-controllers decorated classes
│   │   ├── dtos/                 # Input shape + validation rules
│   │   ├── middlewares/          # Auth checkers, error handler, rate limiter, request context
│   │   └── validators/           # Custom class-validator decorators
│   ├── core/                     # Domain — zero framework dependencies
│   │   ├── entities/             # Pure domain objects (Product, Order, Cart…)
│   │   ├── usecases/             # One class per business operation
│   │   ├── repositories/         # Interfaces (IProductRepository, etc.)
│   │   ├── services/             # Service interfaces (IPaymentService, etc.)
│   │   ├── events/               # Domain event definitions + listener interfaces
│   │   ├── listeners/            # Event handler implementations
│   │   ├── notifications/        # Notification types, channels, factory, manager
│   │   ├── errors/               # Typed domain errors
│   │   └── common/               # Result<T>, RequestContext, UserRole
│   ├── adapters/                 # Implements core interfaces with real tech
│   │   ├── repositories/         # Drizzle-backed repo implementations + mappers
│   │   ├── security/             # BcryptPasswordHasher
│   │   └── services/             # LocalizationService, LoggerFactory
│   ├── infrastructure/           # External systems wiring
│   │   ├── db/                   # Pool, Drizzle instance, migrate.ts, schema/
│   │   ├── queue/                # BullMQ Queue, Worker, Redis connection
│   │   ├── events/               # EventRegistry, EventProcessor
│   │   ├── services/             # FirebaseMessagingService, StripeService
│   │   └── storage/              # FirebaseStorageService
│   ├── config/
│   │   ├── Containers/           # TypeDI wiring (AppContainers.ts)
│   │   └── openapi.ts            # Scalar UI setup
│   └── lib/
│       └── auth.ts               # better-auth server configuration
├── drizzle/
│   └── migrations/               # Generated SQL migration files
├── drizzle.config.ts             # Points drizzle-kit at schema + DB
├── .env                          # Local environment variables (never commit)
├── package.json
├── tsconfig.json
└── frontend/                     # Next.js 16 app (LACUNA brand)
    ├── app/                      # App Router pages
    │   ├── layout.tsx            # Root layout — fonts, canvas bg, cursor, nav
    │   ├── page.tsx              # Homepage — product grid
    │   ├── products/[slug]/      # Product detail page
    │   ├── cart/                 # Cart page
    │   ├── checkout/             # Checkout with saved addresses
    │   ├── login/ & register/    # Auth pages (better-auth client)
    │   ├── orders/ & orders/[id] # Order history + detail + status timeline
    │   ├── wishlist/             # Wishlist management
    │   ├── science/              # Brand story page
    │   └── not-found.tsx         # 404
    ├── components/               # Shared UI
    │   ├── Navigation.tsx        # Fixed nav, menu overlay, session-aware
    │   ├── NotificationBell.tsx  # Bell icon + notification dropdown
    │   ├── ProductCard.tsx       # Hover lift + illuminate + magnetic tilt
    │   ├── ProductEmergence.tsx  # Full product detail layout
    │   ├── VariantPicker.tsx     # Observatory pill selector
    │   ├── WishlistButton.tsx    # Heart toggle, auth-gated
    │   ├── ReviewSection.tsx     # Star rating form + review list
    │   ├── StarRating.tsx        # SVG star display
    │   ├── MonoText.tsx          # Scan-line + breath text effect
    │   ├── ObservatoryBackground.tsx  # Canvas fog animation
    │   ├── ObservatoryInput.tsx  # Underline-only styled input
    │   └── Cursor.tsx            # Custom cursor
    ├── lib/
    │   ├── api.ts                # All API helpers (serverFetch, clientFetch, cartApi…)
    │   ├── auth-client.ts        # better-auth createAuthClient
    │   ├── types.ts              # ApiProduct, ApiOrder, ApiReview… (backend shapes)
    │   ├── products.ts           # Static product data (Observatory content layer)
    │   └── store.ts              # Zustand cart store
    ├── proxy.ts                  # Next.js 16 proxy (auth guard for protected routes)
    ├── next.config.ts            # Rewrites /api/* → localhost:3000
    └── package.json
```

---

## Prerequisites

Before you run a single command, make sure every item below is installed and verified.

| Tool | Version | Where to get it |
|---|---|---|
| **Node.js** | 22.x | https://nodejs.org — use the LTS installer |
| **npm** | 10+ | Ships with Node — verify with `npm -v` |
| **PostgreSQL** | 17.x | https://www.postgresql.org/download — install as a Windows service |
| **Redis** | any (5+ recommended) | `winget install Redis.Redis` on Windows |
| **Git** | any | https://git-scm.com |

> **Windows note:** After installing Redis via winget, close and reopen your terminal before the `redis-server` command becomes available.

---

## Running the Project — Complete Guide

This project has **four processes** that must all be running at the same time for the full stack to work. Open four terminal windows (or use your IDE's split terminal).

```
Terminal 1  →  Redis
Terminal 2  →  Express backend   (port 3000)
Terminal 3  →  Events worker     (optional — async notifications)
Terminal 4  →  Next.js frontend  (port 3001)
```

---

### Step 1 — Verify your infrastructure

Before touching any code, confirm that PostgreSQL and Redis can actually accept connections.

**Check PostgreSQL:**
```bash
psql -U postgres -h localhost -c "SELECT version();"
# Expected output: PostgreSQL 17.x ...
# If you get "password authentication failed" → see Troubleshooting below
```

**Check Redis:**
```bash
redis-cli ping
# Expected output: PONG
# If redis-cli is not found → open a new terminal (winget install needs a fresh shell)
```

---

### Step 2 — Clone & install dependencies

```bash
# Clone the repo
git clone <repo-url>
cd express-boilerplate

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

### Step 3 — Configure environment variables

Create the `.env` file in the project root (next to `package.json`). This file is gitignored — never commit it.

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Or create it manually
```

Fill in every value:

```env
# ── Database ────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:<your-pg-password>@localhost:5432/myapp

# ── Redis ───────────────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Better Auth ─────────────────────────────────────────────────────────────
# BETTER_AUTH_SECRET must be at least 32 random characters.
# Generate one: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
BETTER_AUTH_SECRET=your-secret-key-at-least-32-chars-long-here
BETTER_AUTH_URL=http://localhost:3000

# ── Firebase (leave as-is for local dev — push notifications won't work but app runs fine)
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
FIREBASE_STORAGE_BUCKET=your-bucket-name

# ── Server ──────────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=3000
```

> **Important:** `BETTER_AUTH_URL` must point to the **backend** (port 3000), not the frontend. This is where better-auth handles auth callbacks.

---

### Step 4 — Create the database and run migrations

This is a one-time step. Once the database and tables exist, you never need to repeat it unless you wipe the DB or a new migration is added.

```bash
# 1. Create the database
psql -U postgres -h localhost -c "CREATE DATABASE myapp;"

# 2. Verify the database was created
psql -U postgres -h localhost -c "\l"
# You should see 'myapp' in the list

# 3. Run all migrations (creates all 16 tables)
npm run db:migrate

# 4. Verify tables were created
psql -U postgres -h localhost -d myapp -c "\dt"
# Expected: account, addresses, carts, categories, device_tokens,
#           notifications, orders, order_status_history, product_variants,
#           products, reports, reviews, session, user, verification, wishlists
```

If you want to visually browse the database structure:
```bash
npm run db:studio
# Opens Drizzle Studio in your browser at http://localhost:4983
```

---

### Step 5 — Start Redis (Terminal 1)

Redis must be running before the backend starts. BullMQ will crash on boot if Redis is unreachable.

```bash
# Windows — run directly (stays in foreground, ctrl+C to stop)
redis-server

# Or start as a background Windows service (requires admin)
net start Redis
```

Verify it's alive:
```bash
redis-cli ping
# → PONG
```

---

### Step 6 — Start the backend (Terminal 2)

```bash
# From the project root
npm run dev
```

**What you should see on a clean start:**
```
[Redis] Using REDIS_URL configuration
[Redis] Creating connection with enhanced stability settings
[EventRegistry] Initializing event listeners...
[EventRegistry] Initialization complete. Registered N event types.
✅ Server is running on http://localhost:3000
✅ API documentation available at http://localhost:3000/docs
```

**Verify it works:**
```bash
curl http://localhost:3000/api/auth/ok
# → {"ok":true}

curl http://localhost:3000/
# → Hello from undefined vundefined! API docs at /docs
```

Open the interactive API docs:
```
http://localhost:3000/docs
```

> The backend uses `--watch` so it **automatically restarts** whenever you save a `.ts` file. You never need to restart it manually during development.

---

### Step 7 — Start the events worker (Terminal 3, optional)

The events worker processes background jobs from the BullMQ queue — things like sending notifications after an order is placed. The app works without it (events are queued but not processed), but you'll want it running for full functionality.

```bash
# From the project root
npm run events:worker:dev
```

**What you should see:**
```
[EventsWorker] Worker started, listening on queue: domain-events
```

> If you see Redis version warnings, the jobs are still queued — they just may not process correctly until Redis 5+ is in use.

---

### Step 8 — Start the frontend (Terminal 4)

```bash
# From the frontend directory
cd frontend
npm run dev
```

**What you should see:**
```
▲ Next.js 16.1.6 (Turbopack)
- Local:   http://localhost:3001
- Ready in Xms
```

**Verify the full stack is connected:**
1. Open `http://localhost:3001` — you should see the LACUNA product grid
2. Open the hamburger menu — "Enter →" link confirms auth is wired (unauthenticated state)
3. Go to `http://localhost:3001/register` and create an account
4. Check `http://localhost:3000/api/auth/get-session` — should return your session after login

---

### All-at-once quick start (after first-time setup)

Once the database exists and `.env` is filled, your daily startup is just:

```bash
# Terminal 1
redis-server

# Terminal 2 (from project root)
npm run dev

# Terminal 3 (from project root, optional)
npm run events:worker:dev

# Terminal 4 (from frontend/)
cd frontend && npm run dev
```

---

## NPM Scripts Reference

### Backend

| Script | What it does |
|---|---|
| `npm run dev` | Node.js `--watch` + ts-node ESM loader — auto-restarts on file save |
| `npm run build` | Compiles TypeScript to `dist/` |
| `npm run start` | Runs compiled output (`dist/main.js`) — for production |
| `npm run db:generate` | Generates new Drizzle migration SQL from schema changes |
| `npm run db:migrate` | Applies pending migrations to the DB |
| `npm run db:studio` | Opens Drizzle Studio at `localhost:4983` |
| `npm run events:worker:dev` | Starts the BullMQ worker (processes async events) |
| `npm run workers:dev` | Alias — starts all workers in parallel |
| `npm run test` | Jest test suite |
| `npm run type:check` | TypeScript type check without emitting files |

### Frontend

| Script | What it does |
|---|---|
| `npm run dev` | Next.js dev server with Turbopack (port 3001) |
| `npm run build` | Production build — TypeScript check + static generation |
| `npm run start` | Serves the production build on port 3001 |
| `npm run lint` | ESLint across the frontend codebase |

---

## Troubleshooting

### "password authentication failed for user postgres"

Your PostgreSQL password doesn't match `.env`. Two options:

**Option A — Reset the password (recommended):**

Temporarily switch PostgreSQL to trust authentication, reset the password, then switch back:

1. Edit `C:\Program Files\PostgreSQL\17\data\pg_hba.conf`
   Change every `scram-sha-256` to `trust`
2. Restart PostgreSQL service (as Administrator):
   ```powershell
   Restart-Service postgresql-x64-17
   ```
3. Set a new password:
   ```bash
   psql -U postgres -h 127.0.0.1 -c "ALTER USER postgres PASSWORD 'yournewpassword';"
   ```
4. Edit `pg_hba.conf` back — change `trust` back to `scram-sha-256`
5. Restart the service again
6. Update `DATABASE_URL` in `.env` with the new password

**Option B — Find your existing password:**
Open pgAdmin 4 → right-click the server → Properties → Connection tab.

---

### Backend crashes immediately with `[Object: null prototype]`

This is a TypeScript compilation error thrown by ts-node during module loading. It's intentionally obscured by Node.js's ESM error formatting.

**How to find the real error:**
```bash
node --loader ts-node/esm -e "
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
try {
  await import('./src/config/Containers/AppContainers.js');
  console.log('OK');
} catch(e) {
  console.error('ERROR:', e?.message ?? e);
}
process.exit(0);
"
```

The actual TypeScript error will print clearly. Fix the type error in the reported file.

---

### "Invalid origin" 403 on auth routes

better-auth rejects requests from unknown origins. Add your frontend URL to `trustedOrigins` in `src/lib/auth.ts`:

```typescript
export const auth = betterAuth({
  // ...
  trustedOrigins: [
    "http://localhost:3001",   // dev frontend
    "https://yourdomain.com",  // production
  ],
});
```

---

### Redis connection errors / BullMQ warnings

```
Error: Stream isn't writeable and enabling ready check...
```

Redis is either not running or the version is too old. Verify:
```bash
redis-cli ping        # must return PONG
redis-cli info server | grep redis_version
```

If version is below 5.0, BullMQ will queue jobs but may not process them correctly. For development this is acceptable. For production, use Redis 6+ (via Docker or a managed service like Upstash).

---

### "useSearchParams() should be wrapped in a Suspense boundary"

Next.js requires any component using `useSearchParams()` to be wrapped in `<Suspense>`. Pattern:

```tsx
function MyForm() {
  const searchParams = useSearchParams(); // hook is here
  // ...
}

export default function MyPage() {
  return (
    <Suspense>
      <MyForm />
    </Suspense>
  );
}
```

---

### Frontend hydration mismatch errors

Usually caused by Zustand reading localStorage (client-only) on first render. The cart badge and session-dependent UI must be gated behind a `mounted` flag:

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

// Only render after hydration:
{mounted && cartCount > 0 && <CartBadge />}
```

---

### `myapp` database does not exist

```bash
psql -U postgres -h localhost -c "CREATE DATABASE myapp;"
npm run db:migrate
```

---

### Port already in use

```bash
# Find what's using port 3000
netstat -ano | findstr :3000
# Kill it (replace PID)
taskkill /PID <PID> /F

# Or just change PORT in .env
PORT=3001   # backend
# And update BETTER_AUTH_URL accordingly
```

---

## Architecture Deep Dive

### Clean Architecture (Backend)

The backend strictly enforces four layers. **Dependencies only flow inward** — outer layers know about inner layers, never the reverse.

```
HTTP Request
     │
     ▼
┌─────────────────────────────────┐
│  API Layer                      │  Controllers, DTOs, Middlewares
│  (routing-controllers)          │  Knows about: Use Cases, Entities
└────────────────┬────────────────┘
                 │ calls
                 ▼
┌─────────────────────────────────┐
│  Core / Domain Layer            │  Use Cases, Entities, Interfaces
│  (zero framework deps)          │  Knows about: nothing external
└────────────────┬────────────────┘
                 │ interfaces implemented by
                 ▼
┌─────────────────────────────────┐
│  Adapters Layer                 │  Repositories, Mappers, Security
│  (implements core interfaces)   │  Knows about: Core, Infrastructure
└────────────────┬────────────────┘
                 │ uses
                 ▼
┌─────────────────────────────────┐
│  Infrastructure Layer           │  DB pool, Redis, Firebase, Stripe
│  (real tech integrations)       │  Knows about: nothing above
└─────────────────────────────────┘
```

**Why this matters:** You can swap PostgreSQL for MongoDB, or Stripe for PayPal, without touching a single use case. The domain is pure TypeScript business logic.

---

### Dependency Injection (TypeDI)

All wiring happens in `src/config/Containers/AppContainers.ts`. The order of `Container.set()` calls is critical — dependencies must be registered before their dependents.

```typescript
// Pattern: register by interface token, instantiate via class
Container.set('IProductRepository', Container.get(ProductRepository));
Container.set('IGetProductUseCase', Container.get(GetProductUseCase));
// GetProductUseCase receives IProductRepository via @Inject('IProductRepository')
```

Controllers use `@Inject('IToken')` decorators and are auto-discovered by `routing-controllers` via the `controllers` array in `main.ts`. The bridge is `useContainer(Container)` called before `useExpressServer()`.

**If you add a new use case:**
1. Create the interface + class in `src/core/usecases/`
2. Register both in `AppContainers.ts`
3. Inject into the relevant controller

---

### Result Pattern

Every use case returns `Result<T>` — never throws. This eliminates try/catch pollution in controllers.

```typescript
// Use case returns:
return ResultHelper.success(order);
return ResultHelper.failure('Cart is empty', ErrorCode.VALIDATION_ERROR);

// Controller handles:
return this.handleResultAsJson(result, res);
// BaseController maps ErrorCode → HTTP status automatically
```

**Error codes → HTTP status mapping** lives in `BaseController.ts`. Extend it there when you add new error types.

---

### Authentication (better-auth)

**How it works end-to-end:**

```
Browser → POST /api/auth/sign-in/email → Express → better-auth handler
                                                          │
                                               validates credentials
                                               creates session in DB
                                               sets cookie: better-auth.session_token
                                                          │
                                               ← 200 + Set-Cookie
```

The backend mounts better-auth **before** routing-controllers:
```typescript
app.all('/api/auth/{*splat}', toNodeHandler(auth));  // catches all /api/auth/* first
useExpressServer(app, { ... });                        // then the rest
```

Protected routes use the `@Authorized()` decorator. The `authorizationChecker` in `src/api/middlewares/authenticationCheckers.ts` calls `auth.api.getSession()` on every request to a guarded endpoint and attaches the user to the request context.

**Frontend proxy:** All `/api/*` calls from Next.js are rewritten to `http://localhost:3000/api/*` in `next.config.ts`. This means the same cookie works for both auth and API calls — no CORS headaches.

**Trusted origins:** `http://localhost:3001` is listed in `trustedOrigins` inside `src/lib/auth.ts`. Add your production domain there before deploying.

---

### Event System

The backend is event-driven for side effects (notifications, stock alerts, etc.). The flow:

```
Use Case → IEventEmitter.emit(event) → BullMQ Queue ("domain-events")
                                              │
                                    eventsWorker.ts (separate process)
                                              │
                                    EventProcessor → EventRegistry.getListeners(type)
                                              │
                                    Listener.handle(event) → sends notification / updates DB
```

**To add a new domain event:**

1. Define the event in `src/core/events/`:
   ```typescript
   export const myEvent = (payload: MyPayload): DomainEvent => ({
     type: 'my.event.happened',
     payload,
     occurredAt: new Date(),
   });
   ```

2. Create a listener in `src/core/listeners/`:
   ```typescript
   @Service()
   export class MyEventListener implements IEventListener<MyPayload> {
     async handle(event: DomainEvent<MyPayload>): Promise<void> { ... }
   }
   ```

3. Register in `src/infrastructure/events/index.ts`:
   ```typescript
   export const EVENT_LISTENER_MAP = {
     'my.event.happened': [MyEventListener],
     // ...
   };
   ```

4. Emit in your use case: `await this.eventEmitter.emit(myEvent(payload))`

The worker must be running (`npm run events:worker:dev`) for listeners to execute.

---

### Database Schema

16 tables, all managed by Drizzle ORM. Never edit migration files directly — always use `npm run db:generate` after changing schema files.

| Table | Purpose |
|---|---|
| `user` | better-auth managed — email, name, role |
| `session` | better-auth sessions with expiry |
| `account` | OAuth providers + password hashes |
| `verification` | Email verification tokens |
| `products` | Catalog items — name, price, stock, category |
| `product_variants` | SKU-level variants with attributes (size, scent, etc.) |
| `categories` | Hierarchical tree (parentId self-reference) |
| `carts` + `cart_items` | Per-user cart |
| `orders` + `order_items` | Placed orders, immutable price snapshot |
| `order_status_history` | Audit trail of status changes |
| `reviews` | User reviews with moderation flag |
| `wishlists` + `wishlist_items` | Per-user saved items |
| `addresses` | Saved shipping addresses |
| `notifications` | In-app notification inbox |
| `device_tokens` | FCM tokens for push notifications |
| `reports` | User-reported content |

**Migrations workflow:**
```bash
# After editing a schema file:
npm run db:generate   # creates SQL in drizzle/migrations/
npm run db:migrate    # applies it to DB

# Browse data visually:
npm run db:studio
```

---

### API Endpoints

All routes prefixed with `/api`. Authentication via cookie (web) or `Authorization: Bearer <token>` (API clients).

#### Auth — handled entirely by better-auth at `/api/auth/*`
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/sign-up/email` | Register |
| POST | `/api/auth/sign-in/email` | Login |
| POST | `/api/auth/sign-out` | Logout |
| GET | `/api/auth/get-session` | Current session |
| GET | `/api/auth/reference` | Interactive API docs (Scalar) |

#### Products
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | No | List all products |
| GET | `/api/products/:id` | No | Get product by ID |
| POST | `/api/products` | Yes | Create product |
| GET | `/api/products/:id/variants` | No | List variants |
| POST | `/api/products/:id/variants` | Yes | Add variant |

#### Cart
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/cart` | Yes | Get user's cart |
| POST | `/api/cart/add` | Yes | Add item |
| DELETE | `/api/cart/:itemId` | Yes | Remove item |
| DELETE | `/api/cart` | Yes | Clear cart |

#### Orders
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/orders/checkout` | Yes | Place order (validates stock, processes payment) |
| GET | `/api/orders` | Yes | List user's orders |
| GET | `/api/orders/:id` | Yes | Order detail |

#### Reviews
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/reviews/product/:productId` | No | List approved reviews |
| POST | `/api/reviews` | Yes | Submit review (pending moderation) |
| PATCH | `/api/reviews/:id/approve` | Admin | Approve review |

#### Wishlist
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/wishlist` | Yes | Get wishlist |
| POST | `/api/wishlist` | Yes | Add item |
| DELETE | `/api/wishlist/:productId` | Yes | Remove item |

#### Addresses
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/addresses` | Yes | List saved addresses |
| POST | `/api/addresses` | Yes | Save new address |
| PUT | `/api/addresses/:id` | Yes | Update address |
| DELETE | `/api/addresses/:id` | Yes | Delete address |

#### Users
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users/me` | Yes | Current user profile |
| PATCH | `/api/users/me` | Yes | Update profile |
| GET | `/api/notifications` | Yes | Notification inbox |

Full interactive docs available at **`http://localhost:3000/docs`** (Scalar UI).

---

## Frontend Architecture

### Design System — Observatory Aesthetic

LACUNA is a fictional ultra-premium skincare brand. The entire UI follows a strict visual language:

| Token | Value | Use |
|---|---|---|
| `--parchment` | `#F4F3F0` | Page background |
| `--ink` | `#1A1918` | Primary text |
| `--copper` | `#C8A882` | Accents, borders, CTAs |
| `--whisper` | `#9B9690` | Secondary text, labels |
| Font (display) | Cormorant Garamond | Headlines, prices |
| Font (mono) | DM Mono | Labels, metadata, tracking numbers |

**Rules for new UI:**
- No Tailwind classes. All styles are inline objects.
- No `border-radius` on containers (zero unless round).
- Borders are `0.5px`, never `1px`.
- Buttons have no background — underline lines only.
- Cursors are custom (the `<Cursor>` component) — never use `cursor: pointer`.

---

### Next.js Data Fetching Strategy

```
Server Component (RSC)          Client Component
        │                               │
serverFetch()                    clientFetch()
        │                               │
Direct HTTP to                  /api/* proxy
localhost:3000                  → localhost:3000
(no round-trip through proxy)   (through Next.js rewrite)
```

**Server Components** handle all initial data (product lists, product detail, order history). They call `serverFetch()` from `lib/api.ts` which hits the Express server directly. Failures fall back to static data gracefully.

**Client Components** use `clientFetch()` which hits `/api/*` — the Next.js rewrite forwards this to Express. Credentials (cookies) are always included so session is preserved.

---

### Auth Flow (Frontend)

```
User fills login form
        │
signIn.email({ email, password })     ← better-auth/react client
        │
POST /api/auth/sign-in/email          ← goes through Next.js proxy
        │                                → forwarded to Express
        │
Express → better-auth handler
        │
Sets cookie: better-auth.session_token
        │
useSession() hook updates across all components
        │
proxy.ts detects cookie on protected routes (/cart, /checkout, etc.)
```

The `proxy.ts` (Next.js 16 name for middleware) guards these routes at the edge:
- `/cart`, `/checkout`, `/orders`, `/wishlist`, `/profile`

Unauthenticated requests are redirected to `/login?from=<original-path>` and bounce back after login.

---

### Key Components

#### `ProductCard` — Three hover effects combined
- **Surface:** `translateY(-6px)` + parchment shadow on hover, depress on click
- **Illuminate:** Background wash deepens, product name darkens
- **Magnetic:** Cursor-aware 3D tilt `±3deg` via `rotateX/Y` with `perspective(1000px)`
- **Countertilt:** Inner content tilts opposite direction at `0.4x` factor for depth
- All transitions use `cubic-bezier(0.16, 1, 0.3, 1)` — honey-like damping

#### `MonoText` — Two stacked text effects
- **Scan Line (B):** 0.5px copper line sweeps left→right on hover (900ms), characters solidify progressively behind it
- **Breath (C):** Letter-spacing expands `+0.06em` on hover (600ms ease)
- Characters dim to `opacity: 0` before the scan line starts (300ms delay)

#### `ObservatoryBackground` — Canvas fog animation
- Multiple soft blob shapes animate position and opacity
- Creates the atmospheric "edge of what skin remembers" feeling
- Runs on a `requestAnimationFrame` loop, pauses when tab is hidden

---

### Protected Routes & State

| Route | Auth required | Data source |
|---|---|---|
| `/` | No | Static products (lib/products.ts) |
| `/products/[slug]` | No | Static + RSC fetch reviews |
| `/cart` | Yes (proxy) | Zustand store (localStorage) |
| `/checkout` | Yes (proxy) | API: addresses + cart |
| `/orders` | Yes (proxy) | API: ordersApi.list() |
| `/orders/[id]` | Yes (proxy) | API: ordersApi.get() |
| `/wishlist` | Yes (proxy) | API: wishlistApi.get() |
| `/login`, `/register` | No | — |
| `/science` | No | Static |

> **Note on cart state:** The cart currently lives in Zustand (localStorage) for fast UX. When the user is authenticated, the checkout flow reads from the Zustand store and sends it to the Express `/api/orders/checkout` endpoint. Future work: sync Zustand cart to the backend `/api/cart` on login.

---

## Checkout Flow

This is the most complex workflow — understand it fully before modifying.

```
1. User clicks "Reserve"
   └─ Opens /checkout

2. /checkout page loads
   ├─ addressApi.list() → saved addresses
   └─ Zustand cart items

3. User selects/enters shipping address + payment method

4. POST /api/orders/checkout → CheckoutUseCase:
   ├─ Validate cart not empty
   ├─ Begin DB transaction
   │   ├─ For each cart item:
   │   │   ├─ Verify product exists + active
   │   │   ├─ Verify stock >= quantity
   │   │   └─ Decrement stock (variant or product level)
   │   ├─ Create Order entity (status: PENDING)
   │   ├─ If paymentMethod === 'stripe':
   │   │   └─ StripeService.createCharge() → get paymentIntentId
   │   ├─ Set order status → CONFIRMED
   │   ├─ orderRepo.create(order)
   │   └─ cartRepo.clearCart(userId)
   └─ End transaction (rolls back everything if any step fails)

5. Emit orderPlaced event → BullMQ queue
   └─ Worker → listener → in-app notification

6. Return order to frontend
   └─ Show "Track order →" link
```

**Stock is decremented atomically inside the transaction.** If payment fails, the transaction rolls back and stock is restored. This prevents overselling.

---

## Payment Integration (Stripe)

`StripeService` is currently a **stub** — it returns a fake `paymentIntentId` without calling Stripe's API. To activate real payments:

1. Add `STRIPE_SECRET_KEY` to `.env`
2. Install: `npm install stripe`
3. Replace the stub in `src/infrastructure/services/StripeService.ts`:

```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async createCharge(input: ChargeInput): Promise<Result<ChargeResult>> {
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(input.amount * 100),
    currency: input.currency,
    metadata: { orderId: input.orderId, userId: input.userId },
  });
  return ResultHelper.success({
    paymentIntentId: intent.id,
    clientSecret: intent.client_secret!,
    status: intent.status,
  });
}
```

4. On the frontend, use `@stripe/stripe-js` to confirm the PaymentIntent with the `clientSecret`.

---

## Notification System

Notifications are delivered through three channels simultaneously:

| Channel | File | When |
|---|---|---|
| **Database** | `DatabaseChannel.ts` | Always — stores in `notifications` table for the bell icon |
| **FCM** | `FCMChannel.ts` | When user has registered device tokens |
| **Email** | `EmailChannel.ts` | Stub — wire up SendGrid/Mailgun here |

**Flow:** Domain event → Listener → `NotificationManager.send()` → `NotificationFactory.create()` → routes to all channels.

To add a new notification type:
1. Create `src/core/notifications/MyNotification.ts` extending `Notification`
2. Add it to `NotificationFactory`
3. Create a listener that builds + sends it
4. Register the listener in the event map

---

## Environment Variables

### Backend (`.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `BETTER_AUTH_SECRET` | ✅ | Min 32 chars — signs session tokens |
| `BETTER_AUTH_URL` | ✅ | Backend base URL (`http://localhost:3000`) |
| `PORT` | No | Default: 3000 |
| `NODE_ENV` | No | `development` / `production` |
| `STRIPE_SECRET_KEY` | No | Activates real Stripe payments |
| `GOOGLE_APPLICATION_CREDENTIALS` | No | Path to Firebase service account JSON |
| `FIREBASE_STORAGE_BUCKET` | No | Firebase Storage bucket name |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | No | Frontend URL, default `http://localhost:3001` |
| `BACKEND_URL` | No | Backend URL for proxy rewrite, default `http://localhost:3000` |

---

## Adding a New Feature — Checklist

When adding a complete feature (e.g., "product bundles"):

**Backend:**
- [ ] Add Drizzle schema to `src/infrastructure/db/schema/`
- [ ] Run `npm run db:generate` → commit the migration
- [ ] Add domain entity in `src/core/entities/`
- [ ] Add repository interface in `src/core/repositories/`
- [ ] Implement repository + mapper in `src/adapters/repositories/`
- [ ] Write use case in `src/core/usecases/`
- [ ] Add DTO with class-validator decorators in `src/api/dtos/`
- [ ] Add controller in `src/api/controllers/`
- [ ] Register everything in `AppContainers.ts`
- [ ] Export controller from `src/api/controllers/index.ts`

**Frontend:**
- [ ] Add API helper to `lib/api.ts`
- [ ] Add type to `lib/types.ts`
- [ ] Create page in `app/`
- [ ] Add to `proxy.ts` matcher if auth-protected
- [ ] Add to Navigation if nav item needed

---

## Known Limitations & Next Steps

| Item | Status | Notes |
|---|---|---|
| Redis version | ⚠️ | Windows install is v3.0.504 — BullMQ needs v5+ for full job processing. Events emit but worker may not process |
| Cart sync | 📋 | Cart is Zustand-only. On login, should sync to `/api/cart` |
| Stripe | 📋 | Stub only. See Payment Integration section |
| Firebase FCM | 📋 | Needs real `firebase-service-account.json` |
| Product seeding | 📋 | Frontend uses static mock data. Seed the DB to use real products |
| Admin panel | 📋 | Not built yet. Backend has admin routes for product/review/category management |
| Email notifications | 📋 | `EmailChannel.ts` is a stub |
| pg_hba.conf | ⚠️ | Currently set to `trust` for local dev. Switch back to `scram-sha-256` before any deployment |

---

## Code Conventions

- **No `any` types.** If you need `any`, use `unknown` and narrow it.
- **All use cases return `Result<T>`.** Never throw from a use case.
- **Mappers are stateless static classes.** `toDomain()` converts DB row → entity. `toPersistence()` converts entity → DB row.
- **One file, one class.** No barrel exports inside `core/`.
- **Events are fire-and-forget after the transaction commits.** Never emit inside a transaction.
- **Frontend components never import from `core/` or `adapters/`.** Use `lib/types.ts` for shared shapes.

---

*Maintained by the LACUNA engineering team. Update this document when the architecture changes.*
