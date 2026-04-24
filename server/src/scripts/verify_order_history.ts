import 'reflect-metadata';
import { Container } from 'typedi';
import { UpdateOrderStatusUseCase } from '../core/usecases/order/UpdateOrderStatusUseCase.js';
import { GetOrderStatusHistoryUseCase } from '../core/usecases/order/GetOrderStatusHistoryUseCase.js';
import { Order, OrderStatus } from '../core/entities/Order.js';
import { OrderStatusHistory } from '../core/entities/OrderStatusHistory.js';
import { ResultHelper } from '../core/common/Result.js';

// Mock Repositories
const mockOrderRepo = {
    findById: async (id: string) => {
        if (id === 'order-1') {
            return new Order(
                'order-1',
                'user-1',
                [],
                100,
                OrderStatus.PENDING,
                'Address 1',
                'stripe'
            );
        }
        return null;
    },
    update: async (order: Order) => order,
    create: async (order: Order) => order
};

const historyEntries: OrderStatusHistory[] = [];
const mockHistoryRepo = {
    create: async (history: OrderStatusHistory) => {
        historyEntries.push(history);
        return history;
    },
    findByOrderId: async (orderId: string) => {
        return historyEntries.filter(h => h.orderId === orderId);
    },
    getLatestStatus: async (orderId: string) => {
        const filtered = historyEntries.filter(h => h.orderId === orderId);
        return filtered[filtered.length - 1] || null;
    }
};

// Register Mocks
Container.set('IOrderRepository', mockOrderRepo);
Container.set('IOrderStatusHistoryRepository', mockHistoryRepo);

async function verifyOrderHistory() {
    console.log('--- Verifying Order Status History Implementation ---\n');

    const updateStatus = Container.get(UpdateOrderStatusUseCase);
    const getHistory = Container.get(GetOrderStatusHistoryUseCase);

    // 1. Update status to CONFIRMED
    console.log('1. Updating order status to CONFIRMED:');
    const result1 = await updateStatus.execute({
        orderId: 'order-1',
        newStatus: OrderStatus.CONFIRMED,
        comment: 'Payment verified',
        changedBy: 'admin-1'
    });

    if (result1.success) {
        console.log(`- Order status updated to: ${result1.data.status}`);
    }

    // 2. Update status to SHIPPED with tracking
    console.log('\n2. Updating order status to SHIPPED:');
    const result2 = await updateStatus.execute({
        orderId: 'order-1',
        newStatus: OrderStatus.SHIPPED,
        comment: 'Package sent to DHL',
        changedBy: 'admin-1',
        trackingNumber: 'TRACK-123',
        estimatedDeliveryDate: new Date(Date.now() + 86400000 * 3) // 3 days from now
    });

    if (result2.success) {
        console.log(`- Order status updated to: ${result2.data.status}`);
        console.log(`- Tracking number: ${result2.data.trackingNumber}`);
    }

    // 3. Retrieve history
    console.log('\n3. Retrieving status history:');
    const historyResult = await getHistory.execute('order-1');
    if (historyResult.success) {
        console.log(`- Total history entries: ${historyResult.data.length}`);
        historyResult.data.forEach((entry, index) => {
            console.log(`  [${index + 1}] ${entry.fromStatus} -> ${entry.toStatus} (${entry.comment})`);
        });
    }

    console.log('\n--- Verification Complete ---');
}

verifyOrderHistory().catch(console.error);
