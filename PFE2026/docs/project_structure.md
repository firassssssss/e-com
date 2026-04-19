# Project Structure & Development Guide

## Overview
This is a boilerplate built with TypeScript, Node.js, and PostgreSQL. The codebase follows Clean Architecture principles with a hexagonal (onion) architecture pattern, emphasizing separation of concerns and testability.

## Architecture Overview

### Core Layers (Clean Architecture)

#### **1. Core Layer** (`src/core/`)
**Domain models and business logic - completely framework-agnostic**
- **entities/**: Pure domain models (User, Group, GroupMember, GroupInvite)
- **repositories/**: Interface definitions only (IUserRepository, IGroupRepository)
- **usecases/**: Application business logic implementing `IUseCase<Request, Response>`
- **value-objects/**: Domain value objects (Email, UserId, etc.)

#### **2. Adapters Layer** (`src/adapters/`)
**Implementation of core interfaces for external systems**
- **repositories/**: Database implementations using Drizzle ORM
  - Each repository has corresponding mappers/ for domain ↔ DB conversion
- **security/**: Authentication & authorization utilities (bcrypt, JWT)
- **services/**: External service integrations (email, SMS, third-party APIs)

#### **3. Infrastructure Layer** (`src/infrastructure/`)
**Low-level technical concerns and external system integrations**
- **db/**: Database configuration and schema
  - `schema.ts`: All PostgreSQL tables & enums (single source of truth)
  - `migrate.ts`: Migration runner
  - `index.ts`: Database connection management
- **queue/**: Background job processing with BullMQ
  - `eventsWorker.ts`: Event processing workers
  - `scheduleChallengesWorker.ts`: Challenge scheduling workers
- **redis/**: Redis configuration for caching and sessions
- **storage/**: File storage utilities (cloud storage integration)
- **events/**: Event-driven architecture components

#### **4. API Layer** (`src/api/`)
**HTTP interface and delivery concerns**
- **controllers/**: REST endpoints using routing-controllers
- **dtos/**: Request/response validation objects (class-validator)
- **middlewares/**: Cross-cutting concerns (auth, error handling, rate limiting)
- **decorators/**: Custom decorators for controllers

#### **5. Cross-Cutting Concerns**
- **config/**: Environment configuration and validation
- **i18n/**: Internationalization setup
- **utils/**: Shared utilities and helpers
- **scripts/**: Development and deployment scripts

## Key Files & Configuration

### Environment Setup
**Required Environment Variables** (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT token signing
- `PRELUDE_API_KEY`: Prelude SDK integration
- `FIREBASE_SERVICE_ACCOUNT`: Firebase Admin SDK credentials
- Rate limiting and security keys

### Database Management
**Schema-driven development**:
1. Define tables in `src/infrastructure/db/schema.ts`
2. Generate migrations: `npm run db:generate`
3. Apply migrations: `npm run db:migrate`
4. View database: `npm run db:studio`

### Testing Infrastructure
**Comprehensive testing setup**:
- **Test Framework**: Jest with ts-jest for TypeScript support
- **Test Patterns**: 
  - Unit tests: `*.spec.ts` files alongside source code
  - Integration tests: `__tests__/` directories
  - E2E tests: Supertest for HTTP endpoint testing
- **Database Testing**: Automatic test database setup and teardown
- **Test Utilities**: Custom matchers and setup helpers
- **Coverage Reports**: HTML reports generated in `test-report.html`

### Development Workflow

#### **1. Initial Setup**
```bash
# Clone and install
git clone <repository>
cd <project>
npm install

# Environment setup
cp .env.example .env
# Edit .env with your configuration

# Database setup
npm run db:generate
npm run db:migrate
```

#### **2. Development Commands**
```bash
# Development server with hot reload
npm run dev

# Production build and start
npm run build
npm start

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Database management
npm run db:generate    # Generate migrations
npm run db:migrate     # Run migrations
npm run db:studio      # Database GUI

# Background workers (development)
npm run workers:dev

# Code quality
npm run lint          # ESLint
npm run format        # Prettier
npm run type:check    # TypeScript checking
```

#### **3. Feature Development Workflow**
1. **Define requirements**: Update PRD in `.taskmaster/docs/prd.txt`
2. **Generate tasks**: `task-master parse-prd --input=.taskmaster/docs/prd.txt`
3. **Analyze complexity**: `task-master analyze-complexity --research`
4. **Expand tasks**: `task-master expand --id=<task-id>`
5. **Implement following the pattern**:
   - Add/modify entities in `core/entities/`
   - Update repository interfaces in `core/repositories/`
   - Implement repository adapters in `adapters/repositories/`
   - Create use cases in `core/usecases/`
   - Add controllers in `api/controllers/`
   - Create DTOs in `api/dtos/`
   - Write comprehensive tests

### Code Organization Patterns

#### **Domain-Driven Design Patterns**
- **Entities**: Framework-agnostic domain objects with business logic
- **Value Objects**: Immutable objects representing concepts
- **Repositories**: Collection-like interfaces for domain object persistence
- **Use Cases**: Application services implementing specific business workflows
- **DTOs**: Data transfer objects for API communication

#### **Dependency Management**
- **Dependency Injection**: TypeDI for automatic dependency resolution
- **Service Registration**: All services decorated with `@Service()`
- **Interface Segregation**: Core depends only on interfaces, not implementations
- **Clean Architecture**: Dependencies point inward (API → Use Cases → Domain)

#### **Path Aliases** (configured in tsconfig.json)
```typescript
// Import examples
import { User } from '@core/entities/User'
import { IUserRepository } from '@core/repositories/IUserRepository'
import { UserRepository } from '@adapters/repositories/UserRepository'
import { CreateUserUseCase } from '@core/usecases/user/CreateUserUseCase'
```

### Security & Best Practices

#### **Security Layers**
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: class-validator decorators on all DTOs
- **Rate Limiting**: Express-rate-limit for API protection
- **Helmet**: Security headers middleware
- **CORS**: Configured cross-origin resource sharing

#### **Code Quality**
- **Type Safety**: Strict TypeScript configuration
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier for consistent code style
- **Testing**: High test coverage requirement
- **Documentation**: Swagger/OpenAPI auto-generated docs

### Deployment & Operations

#### **Build Process**
```bash
# Production build
npm run build

# Generated files
/dist/                    # Compiled JavaScript
/dist/**/*.js            # Main application files
/dist/**/*.d.ts          # Type definitions
```

#### **Environment-Specific Configurations**
- **Development**: Hot reload, detailed error messages
- **Production**: Optimized builds, error reporting, monitoring
- **Testing**: Separate test database, mock external services

#### **Background Processing**
- **Queue Workers**: BullMQ for background jobs
- **Event Processing**: Real-time event handling
- **Scheduled Tasks**: Cron-based challenge scheduling

### Troubleshooting

#### **Common Issues**
- **Database Connection**: Verify DATABASE_URL format
- **Migration Issues**: Check schema.ts syntax and relationships
- **Test Failures**: Ensure test database is properly configured
- **Build Errors**: Check TypeScript compilation errors
- **Environment Variables**: Verify all required variables are set

#### **Debugging Tools**
- **Database Studio**: `npm run db:studio` for database inspection
- **Swagger UI**: Auto-generated API documentation at `/docs`
- **Test Reports**: HTML reports in `test-report.html`
- **Logging**: Winston logger configured for different environments

### Contributing Guidelines

#### **Code Review Checklist**
- [ ] Code follows established patterns
- [ ] Database migrations are included
- [ ] API documentation is updated

#### **Commit Message Format**
```
type(scope): description

feat(user): add user registration endpoint
fix(auth): resolve JWT token validation issue
docs(api): update swagger documentation
test(user): add unit tests for user service
```

This comprehensive guide should enable any developer to quickly understand the project structure, set up their development environment, and contribute effectively to the codebase.