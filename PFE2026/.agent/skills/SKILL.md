# Antigravity Backend Development Skill

## Overview
This skill contains the complete coding standards, architecture rules, and AI governance guidelines for the Antigravity backend project. Follow these rules strictly when generating or modifying code.

---

## 1. NAMING CONVENTIONS

| Type | Convention | Example |
|------|-----------|---------|
| Classes | PascalCase | `UserRepository`, `ProductController` |
| Variables/Functions | camelCase | `userId`, `getUserById` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_VERSION` |
| Files (classes) | PascalCase | `UserController.ts`, `ProductRepository.ts` |
| Files (utilities) | camelCase | `resultHelper.ts`, `errorHandler.ts` |
| Interfaces | `I` prefix | `IProductRepository`, `IUserService` |
| DTOs | `Dto` suffix | `CreateProductDto`, `UpdateUserDto` |
| Use Cases | `UseCase` suffix | `GetMeUseCase`, `CreateProductUseCase` |

---

## 2. CLEAN ARCHITECTURE LAYERS

### Core Layer (`core/`)
- **Pure business logic only**
- **ALLOWED**: `typedi` decorators (`@Service`, `@Inject`)
- **FORBIDDEN**: `express`, `drizzle-orm`, `bullmq`, `firebase-admin`, any framework code
- Always define interfaces before implementations
- NEVER import from `adapters/` or `infrastructure/`

### Adapters Layer (`adapters/`)
- Repository implementations
- External service adapters
- Can import from `core/` and `infrastructure/`

### Infrastructure Layer (`infrastructure/`)
- Database connections
- External APIs
- Framework setup

### API Layer (`api/`)
- Controllers only
- Route definitions
- Request/response handling

---

## 3. THE 10 MANDATORY RULES

### RULE 1: ALWAYS use Result<T> pattern
```typescript
// ✅ CORRECT
return ResultHelper.success(data);
return ResultHelper.failure('User not found', ErrorCode.NOT_FOUND);

// ❌ FORBIDDEN - Never throw from use cases
throw new Error('not found');
```

### RULE 2: ALWAYS validate inputs via class-validator DTOs
```typescript
// ✅ CORRECT
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;
}
```

### RULE 3: ALWAYS register services in AppContainers.ts
```typescript
// Add to AppContainers.ts
Container.set('IProductRepository', Container.get(ProductRepository));
Container.set('ICreateProductUseCase', Container.get(CreateProductUseCase));
```

### RULE 4: ALWAYS export controllers from api/controllers/index.ts
```typescript
// api/controllers/index.ts
export * from './UserController.js';
export * from './ProductController.js'; // Add new exports
```

### RULE 5: ALWAYS create repository interfaces in core/repositories/ BEFORE implementation
```typescript
// core/repositories/IProductRepository.ts FIRST
export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  create(product: Product): Promise<Product>;
}

// Then adapters/repositories/ProductRepository.ts
```

### RULE 6: ALWAYS use mapper pattern for DB ↔ Domain conversion
```typescript
// adapters/repositories/product/mappers/ProductMapper.ts
export class ProductMapper {
  static toDomain(dbProduct: DbProduct): Product {
    return new Product(dbProduct.id, dbProduct.name, dbProduct.price);
  }
  
  static toPersistence(product: Product): DbProduct {
    return { id: product.id, name: product.name, price: product.price };
  }
}
```

### RULE 7: NEVER put business logic in controllers
```typescript
// ✅ CORRECT - Controller only orchestrates
@Get('/:id')
async getProduct(@Param('id') id: string, @Res() res: Response) {
  const result = await this.getProductUseCase.execute({ id });
  return handleResultAsJson(result, res);
}

// ❌ FORBIDDEN - Business logic in controller
@Get('/:id')
async getProduct(@Param('id') id: string, @Res() res: Response) {
  const product = await this.repository.findById(id);
  if (!product) throw new Error('Not found');
  return res.json(product);
}
```

### RULE 8: NEVER import framework code in core/ layer
```typescript
// ✅ ALLOWED in core/
import { Service, Inject } from 'typedi';

// ❌ FORBIDDEN in core/
import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { Queue } from 'bullmq';
```

### RULE 9: Stub unimplemented features with TODOs
```typescript
// core/services/IRecommendationService.ts
export interface IRecommendationService {
  getRecommendations(userId: string): Promise<Product[]>;
}

// adapters/services/RecommendationService.ts
@Service()
export class RecommendationService implements IRecommendationService {
  async getRecommendations(userId: string): Promise<Product[]> {
    // TODO: Integrate with recommendation engine
    return []; // Mock data for now
  }
}
```

### RULE 10: ALWAYS add JSDoc comments
```typescript
/**
 * Retrieves a product by its unique identifier.
 * @param id - The product ID
 * @returns Result containing the product or failure
 */
@OpenAPI({ summary: 'Get product by ID' })
async execute(input: GetProductInput): Promise<Result<Product>> {
  // implementation
}
```

---

## 4. AI AUTO-GENERATION MATRIX

### ✅ CAN AUTO-GENERATE (Follow Templates)

| Component | Template to Follow | Notes |
|-----------|-------------------|-------|
| Entities | Existing entity patterns | Straightforward data classes |
| DB Schemas | `reports.ts` | Drizzle declarative schemas |
| Repository Interfaces | Simple CRUD signatures | Define in `core/repositories/` |
| Repository Implementations | `UserRepository.ts` | Follow mapper pattern |
| Mappers | Pure transformation functions | DB ↔ Domain |
| DTOs | class-validator decorators | Well-defined pattern |
| Use Cases (CRUD) | `GetMeUseCase.ts` | Follow exactly |
| Controllers (CRUD) | `UserController.ts` | Follow exactly |
| DI Registrations | One-liner additions | `AppContainers.ts` |
| Notification Classes | `UserSigninNotification.ts` | Follow pattern |

### ⚠️ REQUIRES HUMAN REVIEW

| Component | Why |
|-----------|-----|
| Payment Integration | Financial logic, PCI compliance, webhook verification |
| Auth Changes | Security-critical, authorization logic, role management |
| Database Migrations | Destructive operations (drops, renames) |
| Environment Variables | Secrets management, production config |
| Third-party API Keys | Credentials, rate limits, cost implications |
| Business Rules | Pricing, discounts, tax calculations |
| Event Listeners | Side-effects: notifications to real users, external APIs |

---

## 5. CODE STYLE STANDARDS

```typescript
// Semicolons: YES
const user = await repository.findById(id);

// Quotes: Single
const message = 'User not found';

// Trailing commas: YES (ES5)
const config = {
  host: 'localhost',
  port: 3000,
};

// Indentation: 2 spaces
if (condition) {
  doSomething();
}

// Line length: 120 characters max
// Import ordering:
import * from 'path';              // 1. Node builtins
import express from 'express';     // 2. External packages
import { User } from './User.js';  // 3. Internal modules

// File encoding: UTF-8, LF line endings
// ESM requirement: Always use .js extension in imports
import { Helper } from './helper.js'; // ✅
import { Helper } from './helper';    // ❌
```

---

## 6. STANDARD TEMPLATES

### Use Case Template
```typescript
import { Service, Inject } from 'typedi';
import { Result, ResultHelper } from '../shared/Result.js';
import { ErrorCode } from '../shared/ErrorCode.js';

export interface GetProductInput {
  id: string;
}

export interface IGetProductUseCase {
  execute(input: GetProductInput): Promise<Result<Product>>;
}

@Service()
export class GetProductUseCase implements IGetProductUseCase {
  constructor(
    @Inject('IProductRepository') 
    private productRepository: IProductRepository
  ) {}

  /**
   * Retrieves a product by ID
   * @param input - Contains product ID
   * @returns Result with product or error
   */
  async execute(input: GetProductInput): Promise<Result<Product>> {
    const product = await this.productRepository.findById(input.id);
    
    if (!product) {
      return ResultHelper.failure(
        'Product not found',
        ErrorCode.NOT_FOUND
      );
    }

    return ResultHelper.success(product);
  }
}
```

### Controller Template
```typescript
import { JsonController, Get, Post, Param, Body, Res, UseBefore } from 'routing-controllers';
import { Inject, Service } from 'typedi';
import { Response } from 'express';
import { OpenAPI } from 'routing-controllers-openapi';
import { handleResultAsJson } from '../shared/handleResultAsJson.js';

@JsonController('/api/products')
@Service()
export class ProductController {
  constructor(
    @Inject('IGetProductUseCase') 
    private getProductUseCase: IGetProductUseCase,
    @Inject('ICreateProductUseCase') 
    private createProductUseCase: ICreateProductUseCase
  ) {}

  /**
   * Get product by ID
   */
  @Get('/:id')
  @OpenAPI({ summary: 'Get product by ID' })
  async getProduct(
    @Param('id') id: string,
    @Res() res: Response
  ): Promise<Response> {
    const result = await this.getProductUseCase.execute({ id });
    return handleResultAsJson(result, res);
  }

  /**
   * Create new product
   */
  @Post('/')
  @OpenAPI({ summary: 'Create a new product' })
  async createProduct(
    @Body() dto: CreateProductDto,
    @Res() res: Response
  ): Promise<Response> {
    const result = await this.createProductUseCase.execute(dto);
    return handleResultAsJson(result, res);
  }
}
```

### Repository Interface Template
```typescript
// core/repositories/IProductRepository.ts
import { Product } from '../entities/Product.js';

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  create(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  delete(id: string): Promise<void>;
}
```

### Repository Implementation Template
```typescript
// adapters/repositories/ProductRepository.ts
import { Service } from 'typedi';
import { IProductRepository } from '../../core/repositories/IProductRepository.js';
import { Product } from '../../core/entities/Product.js';
import { db } from '../../infrastructure/database/db.js';
import { products } from '../../infrastructure/database/schema.js';
import { eq } from 'drizzle-orm';
import { ProductMapper } from './mappers/ProductMapper.js';

@Service()
export class ProductRepository implements IProductRepository {
  async findById(id: string): Promise<Product | null> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0] ? ProductMapper.toDomain(result[0]) : null;
  }

  async create(product: Product): Promise<Product> {
    const dbProduct = ProductMapper.toPersistence(product);
    const result = await db.insert(products).values(dbProduct).returning();
    return ProductMapper.toDomain(result[0]);
  }

  // ... other methods
}
```

---

## 7. IMPLEMENTATION WORKFLOW

When implementing a new feature, follow this exact order:

1. **Define Interface** in `core/repositories/` or `core/services/`
2. **Create Entity** (if needed) in `core/entities/`
3. **Create DTO** with validation in `api/dtos/`
4. **Create DB Schema** (Drizzle) in `infrastructure/database/schema.ts`
5. **Create Mapper** in `adapters/repositories/<name>/mappers/`
6. **Implement Repository** in `adapters/repositories/`
7. **Create Use Case** returning `Result<T>` in `core/use-cases/`
8. **Create Controller** delegating to use case in `api/controllers/`
9. **Register in DI** in `AppContainers.ts`
10. **Export Controller** in `api/controllers/index.ts`
11. **Add JSDoc** to all public APIs

---

## 8. COMMON PITFALLS TO AVOID

❌ **DON'T** throw exceptions from use cases - use `Result<T>`  
❌ **DON'T** import Express types in core layer  
❌ **DON'T** put business logic in controllers  
❌ **DON'T** skip DTO validation  
❌ **DON'T** forget to register services in DI container  
❌ **DON'T** create implementations before interfaces  
❌ **DON'T** skip the mapper pattern  
❌ **DON'T** forget to export controllers  
❌ **DON'T** use relative paths without .js extension  
❌ **DON'T** skip JSDoc comments on public APIs  

---

## 9. QUICK REFERENCE

### File Structure
```
src/
├── core/                    # Pure business logic
│   ├── entities/           # Domain models
│   ├── repositories/       # Repository interfaces
│   ├── services/           # Service interfaces
│   └── use-cases/          # Application logic
├── adapters/               # Implementations
│   ├── repositories/       # Repository implementations + mappers
│   └── services/           # Service implementations
├── infrastructure/         # External dependencies
│   └── database/           # DB schemas, connections
├── api/                    # HTTP layer
│   ├── controllers/        # Route handlers
│   ├── dtos/               # Request validation
│   └── middlewares/        # Express middleware
└── AppContainers.ts        # DI registration
```

### Key Imports
```typescript
// Use cases
import { Service, Inject } from 'typedi';
import { Result, ResultHelper } from '../shared/Result.js';
import { ErrorCode } from '../shared/ErrorCode.js';

// Controllers
import { JsonController, Get, Post } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { handleResultAsJson } from '../shared/handleResultAsJson.js';

// DTOs
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
```

---

## AGENT EXECUTION INSTRUCTIONS

When you receive a coding request for Antigravity:

1. **Read this skill first** before writing any code
2. **Identify the feature type** (CRUD, business logic, integration)
3. **Check auto-generation matrix** - can you auto-generate or need human review?
4. **Follow the implementation workflow** in order
5. **Use the appropriate template** for each component
6. **Validate against the 10 mandatory rules** before responding
7. **Add all necessary imports** with .js extensions
8. **Register in DI** and export controllers
9. **Add JSDoc comments** to all public APIs
10. **Output all files needed** in the correct directory structure

If the request involves payment, auth, migrations, or external APIs → **Flag for human review** and create stub implementations with TODOs.

---

**Remember**: Clean Architecture + Result Pattern + Dependency Injection = Antigravity Way