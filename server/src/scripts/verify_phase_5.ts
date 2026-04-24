import 'reflect-metadata';
import { Container } from 'typedi';
import { UpdateProductVariantUseCase } from '../core/usecases/product/variant/UpdateProductVariantUseCase.js';
import { AddReviewUseCase } from '../core/usecases/review/AddReviewUseCase.js';
import { ApproveReviewUseCase } from '../core/usecases/review/ApproveReviewUseCase.js';
import { Review } from '../core/entities/Review.js';
import { ProductVariant } from '../core/entities/ProductVariant.js';
import { Product } from '../core/entities/Product.js';

// Manual Mocks for final integration check
const mockVariantRepo = {
    findById: async (id: string) => ({ id, productId: 'prod-1', stock: 10, lowStockThreshold: 5, name: 'Small', sku: 'SKU-1' }),
    update: async (v: any) => v,
    findBySku: async () => null
};

const mockProductRepo = {
    findById: async (id: string) => ({ id: 'prod-1', name: 'Test Product' }),
    update: async (p: any) => p
};

const mockReviewRepo = {
    create: async (r: any) => r,
    findById: async (id: string) => new Review(id, 'user-1', 'prod-1', 5, 'Great!', [], false, false),
    update: async (r: any) => r,
    calculateAverageRating: async () => ({ average: 4.5, count: 10 })
};

const mockEventEmitter = {
    emit: async (event: any) => {
        console.log(`[Mock-Emitter] Emitted event: ${event.type}`);
    }
};

// Register Mocks
Container.set('IProductVariantRepository', mockVariantRepo);
Container.set('IProductRepository', mockProductRepo);
Container.set('IReviewRepository', mockReviewRepo);
Container.set('IEventEmitter', mockEventEmitter);

async function verifyPhase5() {
    console.log('--- Verifying Phase 5: Final Use Case Integration ---\n');

    const updateVariant = Container.get(UpdateProductVariantUseCase);
    const addReview = Container.get(AddReviewUseCase);
    const approveReview = Container.get(ApproveReviewUseCase);

    // 1. Test Stock Low Event in UpdateVariant
    console.log('1. Testing UpdateProductVariantUseCase (Stock Low):');
    await updateVariant.execute({ id: 'var-1', stock: 3 }); // Threshold is 5

    // 2. Test Review Creation (Moderation Needed)
    console.log('\n2. Testing AddReviewUseCase (Moderation):');
    const reviewResult = await addReview.execute({
        userId: 'user-1',
        productId: 'prod-1',
        rating: 5,
        comment: 'Nice!'
    });
    if (reviewResult.success) {
        console.log(`- Review created with isApproved: ${reviewResult.data.isApproved}`);
    }

    // 3. Test Review Approval
    console.log('\n3. Testing ApproveReviewUseCase:');
    await approveReview.execute({ reviewId: 'rev-1' });

    console.log('\n--- Phase 5 Verification Complete ---');
}

verifyPhase5().catch(console.error);
