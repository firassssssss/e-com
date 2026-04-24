# 🟡 IMPORTANT TABLES - Phase 2 (Post-MVP Enhancements)

**Priority**: IMPLEMENT AFTER CRITICAL TABLES  
**Estimated Time**: 3-4 days  
**Dependencies**: Critical tables must be completed first

---

## Overview

These tables enhance the e-commerce platform with better tracking, inventory management, and payment handling. They're not essential for launch but significantly improve operations.

---

## 1. ORDER STATUS HISTORY TABLE

### Purpose
Audit trail of all order status changes with timestamps for tracking and customer service.

### Database Schema

```typescript
// infrastructure/db/schema/order_status_history.ts
import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const orderStatusHistory = pgTable('order_status_history', {
  id: varchar('id', { length: 255 }).primaryKey(),
  orderId: varchar('order_id', { length: 255 }).notNull().references(() => orders.id, { onDelete: 'cascade' }),
  
  fromStatus: varchar('from_status', { length: 50 }),
  toStatus: varchar('to_status', { length: 50 }).notNull(),
  
  comment: text('comment'), // Optional notes (e.g., "Package handed to courier")
  changedBy: varchar('changed_by', { length: 255 }), // User ID (admin/system)
  
  trackingNumber: varchar('tracking_number', { length: 255 }), // Shipping tracking
  estimatedDeliveryDate: timestamp('estimated_delivery_date'),
  
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Indexes
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created_at ON order_status_history(created_at);
```

### Entity

```typescript
// core/entities/OrderStatusHistory.ts
export class OrderStatusHistory {
  constructor(
    public readonly id: string,
    public orderId: string,
    public fromStatus: string | null,
    public toStatus: string,
    public comment: string | null,
    public changedBy: string | null,
    public trackingNumber: string | null,
    public estimatedDeliveryDate: Date | null,
    public createdAt: Date = new Date()
  ) {}
}
```

### Repository Interface

```typescript
// core/repositories/IOrderStatusHistoryRepository.ts
export interface IOrderStatusHistoryRepository {
  findByOrderId(orderId: string): Promise<OrderStatusHistory[]>;
  create(history: OrderStatusHistory): Promise<OrderStatusHistory>;
  getLatestStatus(orderId: string): Promise<OrderStatusHistory | null>;
}
```

### Use Cases Needed

- `UpdateOrderStatusUseCase` (should also create history entry)
- `GetOrderStatusHistoryUseCase`
- `AddTrackingNumberUseCase`

### Events to Emit

```typescript
// core/events/OrderStatusChangedEvent.ts
export class OrderStatusChangedEvent extends DomainEvent {
  constructor(
    public orderId: string,
    public userId: string,
    public fromStatus: string,
    public toStatus: string,
    public trackingNumber?: string
  ) {
    super('order.status.changed');
  }
}
```

### Notifications

When order status changes:
- **CONFIRMED**: "Your order #123 has been confirmed!"
- **PROCESSING**: "Your order #123 is being prepared"
- **SHIPPED**: "Your order #123 has been shipped! Track: [tracking_number]"
- **DELIVERED**: "Your order #123 has been delivered. Enjoy!"

---

## 2. STOCK MOVEMENTS TABLE

### Purpose
Track all inventory changes (purchases, returns, adjustments, damages) for auditing and analytics.

### Database Schema

```typescript
// infrastructure/db/schema/stock_movements.ts
import { pgTable, varchar, integer, text, timestamp } from 'drizzle-orm/pg-core';

export const stockMovements = pgTable('stock_movements', {
  id: varchar('id', { length: 255 }).primaryKey(),
  productId: varchar('product_id', { length: 255 }).references(() => products.id, { onDelete: 'cascade' }),
  productVariantId: varchar('product_variant_id', { length: 255 }).references(() => productVariants.id, { onDelete: 'cascade' }),
  
  movementType: varchar('movement_type', { length: 50 }).notNull(), // 'PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'DAMAGE'
  quantity: integer('quantity').notNull(), // Positive for increase, negative for decrease
  
  previousStock: integer('previous_stock').notNull(),
  newStock: integer('new_stock').notNull(),
  
  orderId: varchar('order_id', { length: 255 }).references(() => orders.id), // If related to order
  userId: varchar('user_id', { length: 255 }), // Who made the change (admin)
  
  reason: text('reason'), // "Sold to customer", "Restocked from supplier", "Damaged goods"
  referenceNumber: varchar('reference_number', { length: 255 }), // Supplier invoice, etc.
  
  warehouseId: varchar('warehouse_id', { length: 255 }), // For future multi-warehouse support
  
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Indexes
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_variant_id ON stock_movements(product_variant_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
```

### Movement Types Enum

```typescript
// core/entities/StockMovement.ts
export enum StockMovementType {
  PURCHASE = 'PURCHASE',       // Restocking from supplier
  SALE = 'SALE',              // Sold to customer
  RETURN = 'RETURN',          // Customer return
  ADJUSTMENT = 'ADJUSTMENT',   // Manual stock correction
  DAMAGE = 'DAMAGE',          // Damaged/expired goods
  TRANSFER = 'TRANSFER'       // Between warehouses (future)
}
```

### Entity

```typescript
// core/entities/StockMovement.ts
export class StockMovement {
  constructor(
    public readonly id: string,
    public productId: string | null,
    public productVariantId: string | null,
    public movementType: StockMovementType,
    public quantity: number,
    public previousStock: number,
    public newStock: number,
    public orderId: string | null,
    public userId: string | null,
    public reason: string | null,
    public referenceNumber: string | null,
    public warehouseId: string | null,
    public createdAt: Date = new Date()
  ) {}

  isStockIncrease(): boolean {
    return this.quantity > 0;
  }

  isStockDecrease(): boolean {
    return this.quantity < 0;
  }
}
```

### Repository Interface

```typescript
// core/repositories/IStockMovementRepository.ts
export interface IStockMovementRepository {
  findByProductId(productId: string): Promise<StockMovement[]>;
  findByVariantId(variantId: string): Promise<StockMovement[]>;
  findByOrderId(orderId: string): Promise<StockMovement[]>;
  findByType(type: StockMovementType): Promise<StockMovement[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<StockMovement[]>;
  create(movement: StockMovement): Promise<StockMovement>;
}
```

### Use Cases Needed

- `RecordStockMovementUseCase`
- `GetProductStockHistoryUseCase`
- `GetLowStockReportUseCase`
- `AdjustStockUseCase` (admin)

### Auto-Create Movement On:

1. **Order Placed**: Create SALE movement (decrease stock)
2. **Order Returned**: Create RETURN movement (increase stock)
3. **Admin Restocks**: Create PURCHASE movement
4. **Admin Adjustment**: Create ADJUSTMENT movement

---

## 3. STOCK ALERTS TABLE

### Purpose
Track low stock alerts and notify admins when products need restocking.

### Database Schema

```typescript
// infrastructure/db/schema/stock_alerts.ts
import { pgTable, varchar, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const stockAlerts = pgTable('stock_alerts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  productId: varchar('product_id', { length: 255 }).references(() => products.id, { onDelete: 'cascade' }),
  productVariantId: varchar('product_variant_id', { length: 255 }).references(() => productVariants.id, { onDelete: 'cascade' }),
  
  alertType: varchar('alert_type', { length: 50 }).notNull(), // 'LOW_STOCK', 'OUT_OF_STOCK'
  currentStock: integer('current_stock').notNull(),
  threshold: integer('threshold').notNull(),
  
  isResolved: boolean('is_resolved').notNull().default(false),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: varchar('resolved_by', { length: 255 }), // Admin who restocked
  
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Indexes
CREATE INDEX idx_stock_alerts_product_id ON stock_alerts(product_id);
CREATE INDEX idx_stock_alerts_is_resolved ON stock_alerts(is_resolved);
```

### Entity

```typescript
// core/entities/StockAlert.ts
export enum StockAlertType {
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK'
}

export class StockAlert {
  constructor(
    public readonly id: string,
    public productId: string | null,
    public productVariantId: string | null,
    public alertType: StockAlertType,
    public currentStock: number,
    public threshold: number,
    public isResolved: boolean = false,
    public resolvedAt: Date | null = null,
    public resolvedBy: string | null = null,
    public createdAt: Date = new Date()
  ) {}
}
```

### Repository Interface

```typescript
// core/repositories/IStockAlertRepository.ts
export interface IStockAlertRepository {
  findActiveAlerts(): Promise<StockAlert[]>;
  findByProductId(productId: string): Promise<StockAlert[]>;
  create(alert: StockAlert): Promise<StockAlert>;
  resolve(alertId: string, resolvedBy: string): Promise<void>;
}
```

### Use Cases Needed

- `CheckStockLevelsUseCase` (scheduled job - runs daily)
- `GetActiveStockAlertsUseCase` (admin dashboard)
- `ResolveStockAlertUseCase`

### Scheduled Job

```typescript
// Run daily via BullMQ
schedule.every('1 day').run(async () => {
  // Check all products/variants
  // Create alerts for low stock
  // Send notification to admins
});
```

---

## 4. PAYMENT TRANSACTIONS TABLE

### Purpose
Record all payment attempts, successes, failures, and refunds for financial tracking and debugging.

### Database Schema

```typescript
// infrastructure/db/schema/payment_transactions.ts
import { pgTable, varchar, decimal, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const paymentTransactions = pgTable('payment_transactions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  orderId: varchar('order_id', { length: 255 }).notNull().references(() => orders.id),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id),
  
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // 'stripe', 'd17', 'cash_on_delivery'
  
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('TND'),
  
  status: varchar('status', { length: 50 }).notNull(), // 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'
  
  // Payment gateway details
  gatewayTransactionId: varchar('gateway_transaction_id', { length: 255 }), // Stripe/D17 ID
  gatewayResponse: jsonb('gateway_response'), // Full API response for debugging
  
  failureReason: text('failure_reason'),
  
  // Refund tracking
  refundedAmount: decimal('refunded_amount', { precision: 10, scale: 2 }),
  refundedAt: timestamp('refunded_at'),
  refundReason: text('refund_reason'),
  
  metadata: jsonb('metadata'), // Extra data (IP address, device info, etc.)
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Indexes
CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_gateway_id ON payment_transactions(gateway_transaction_id);
```

### Payment Status Enum

```typescript
// core/entities/PaymentTransaction.ts
export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}
```

### Entity

```typescript
// core/entities/PaymentTransaction.ts
export class PaymentTransaction {
  constructor(
    public readonly id: string,
    public orderId: string,
    public userId: string,
    public paymentMethod: string,
    public amount: number,
    public currency: string = 'TND',
    public status: PaymentStatus,
    public gatewayTransactionId: string | null,
    public gatewayResponse: any,
    public failureReason: string | null,
    public refundedAmount: number | null,
    public refundedAt: Date | null,
    public refundReason: string | null,
    public metadata: any,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  isSuccessful(): boolean {
    return this.status === PaymentStatus.SUCCESS;
  }

  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  isRefunded(): boolean {
    return this.status === PaymentStatus.REFUNDED || this.status === PaymentStatus.PARTIALLY_REFUNDED;
  }
}
```

### Repository Interface

```typescript
// core/repositories/IPaymentTransactionRepository.ts
export interface IPaymentTransactionRepository {
  findById(id: string): Promise<PaymentTransaction | null>;
  findByOrderId(orderId: string): Promise<PaymentTransaction[]>;
  findByUserId(userId: string): Promise<PaymentTransaction[]>;
  findByGatewayTransactionId(gatewayId: string): Promise<PaymentTransaction | null>;
  findFailedTransactions(): Promise<PaymentTransaction[]>;
  create(transaction: PaymentTransaction): Promise<PaymentTransaction>;
  update(transaction: PaymentTransaction): Promise<PaymentTransaction>;
}
```

### Use Cases Needed

- `RecordPaymentAttemptUseCase`
- `UpdatePaymentStatusUseCase` (called by webhooks)
- `RefundPaymentUseCase`
- `GetPaymentHistoryUseCase`

### Integration Points

```typescript
// When processing payment in CheckoutUseCase:

// 1. Create PENDING transaction
const transaction = await paymentTransactionRepo.create(
  new PaymentTransaction(id, orderId, userId, 'stripe', amount, 'TND', PaymentStatus.PENDING, ...)
);

// 2. Call payment gateway
const result = await stripeService.createCharge(...);

// 3. Update transaction
if (result.isSuccess) {
  transaction.status = PaymentStatus.SUCCESS;
  transaction.gatewayTransactionId = result.value.paymentIntentId;
} else {
  transaction.status = PaymentStatus.FAILED;
  transaction.failureReason = result.error;
}

await paymentTransactionRepo.update(transaction);
```

---

## 5. D17 PAYMENT INTEGRATION

### Purpose
Support Tunisian payment gateway D17 (alternative to Stripe).

### Configuration

```typescript
// infrastructure/services/D17Service.ts
import { Service } from 'typedi';
import { IPaymentService } from '../../core/services/IPaymentService.js';
import { Result, ResultHelper } from '../../core/common/Result.js';

@Service()
export class D17Service implements IPaymentService {
  private readonly apiUrl: string;
  private readonly merchantId: string;
  private readonly apiKey: string;

  constructor() {
    this.apiUrl = process.env.D17_API_URL || 'https://api.d17.tn';
    this.merchantId = process.env.D17_MERCHANT_ID!;
    this.apiKey = process.env.D17_API_KEY!;
  }

  async createCharge(input: ChargeInput): Promise<Result<ChargeResult>> {
    try {
      // TODO: Implement D17 API call
      // This requires human review for payment integration
      
      const response = await fetch(`${this.apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          merchant_id: this.merchantId,
          amount: input.amount * 1000, // D17 uses millimes
          currency: 'TND',
          order_reference: input.orderId,
          callback_url: `${process.env.API_URL}/api/v1/webhooks/d17`,
          return_url: `${process.env.FRONTEND_URL}/orders/${input.orderId}`
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        return ResultHelper.success({
          paymentIntentId: data.transaction_id,
          clientSecret: data.payment_url, // Redirect URL for user
          status: 'pending'
        });
      }

      return ResultHelper.failure(
        data.message || 'Payment failed',
        ErrorCode.PAYMENT_ERROR
      );
    } catch (error) {
      return ResultHelper.failure(
        'D17 payment error',
        ErrorCode.PAYMENT_ERROR
      );
    }
  }

  async verifyWebhook(payload: string, signature: string): Promise<Result<boolean>> {
    // TODO: Implement D17 webhook signature verification
    return ResultHelper.success(true);
  }

  async refund(transactionId: string): Promise<Result<void>> {
    // TODO: Implement D17 refund
    return ResultHelper.failure('Not implemented', ErrorCode.NOT_IMPLEMENTED);
  }
}
```

### Environment Variables

```env
# .env
D17_MERCHANT_ID=your_merchant_id
D17_API_KEY=your_api_key
D17_API_URL=https://api.d17.tn
```

### Webhook Controller

```typescript
// api/controllers/WebhookController.ts
@JsonController('/api/v1/webhooks')
export class WebhookController {
  @Post('/d17')
  async handleD17Webhook(@Body() payload: any, @HeaderParam('X-D17-Signature') signature: string) {
    // Verify signature
    // Update payment transaction status
    // Update order status
    // Send notification to customer
  }
}
```

---

## Implementation Checklist

### For Each Table:

- [ ] Create database schema
- [ ] Create entity
- [ ] Create repository interface
- [ ] Create repository implementation
- [ ] Create mapper
- [ ] Create use cases
- [ ] Create DTOs
- [ ] Create controller (if needed)
- [ ] Register in DI container
- [ ] Generate migration
- [ ] Apply migration
- [ ] Test thoroughly

---

## Events to Implement

```typescript
// core/events/
- OrderStatusChangedEvent
- StockLevelChangedEvent
- LowStockAlertCreatedEvent
- PaymentSucceededEvent
- PaymentFailedEvent
- RefundProcessedEvent
```

---

## Notifications to Add

```typescript
// Low Stock Alert (to admins)
class LowStockNotification extends BaseNotification {
  getTitle() { return 'Low Stock Alert'; }
  getBody() { return `${productName} is low on stock (${currentStock} remaining)`; }
}

// Payment Failed (to customer)
class PaymentFailedNotification extends BaseNotification {
  getTitle() { return 'Payment Failed'; }
  getBody() { return 'Your payment could not be processed. Please try again.'; }
}

// Order Shipped (to customer)
class OrderShippedNotification extends BaseNotification {
  getTitle() { return 'Order Shipped'; }
  getBody() { return `Your order #${orderId} has been shipped! Tracking: ${trackingNumber}`; }
}
```

---

## Analytics Queries

With these tables, you can now answer:

1. **Revenue Analytics**: Total sales by payment method, by day/week/month
2. **Inventory Health**: Stock movement trends, fast-moving products
3. **Order Fulfillment**: Average time from order to delivery
4. **Payment Success Rate**: Failed vs successful transactions
5. **Customer Behavior**: Repeat purchase rate, cart abandonment

---

**NEXT**: After completing these important tables, proceed to `03-NICE-TO-HAVE-TABLES.md`