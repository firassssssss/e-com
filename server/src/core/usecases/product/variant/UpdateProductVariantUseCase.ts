import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../../common/Result.js';
import { ProductVariant, VariantAttributes } from '../../../entities/ProductVariant.js';
import { IProductVariantRepository } from '../../../repositories/IProductVariantRepository.js';
import { IProductRepository } from '../../../repositories/IProductRepository.js';
import { IEventEmitter } from '../../../services/IEventEmitter.js';
import { VariantStockLowEvent } from '../../../events/VariantStockLowEvent.js';
import { VariantOutOfStockEvent } from '../../../events/VariantOutOfStockEvent.js';

export interface UpdateProductVariantInput {
    id: string;
    sku?: string;
    name?: string;
    attributes?: VariantAttributes;
    price?: number;
    stock?: number;
    compareAtPrice?: number | null;
    lowStockThreshold?: number;
    images?: string[];
    isActive?: boolean;
    isDefault?: boolean;
}

export interface IUpdateProductVariantUseCase {
    execute(input: UpdateProductVariantInput): Promise<Result<ProductVariant>>;
}

@Service()
export class UpdateProductVariantUseCase implements IUpdateProductVariantUseCase {
    constructor(
        @Inject('IProductVariantRepository') private variantRepository: IProductVariantRepository,
        @Inject('IProductRepository') private productRepository: IProductRepository,
        @Inject('IEventEmitter') private eventEmitter: IEventEmitter
    ) { }

    async execute(input: UpdateProductVariantInput): Promise<Result<ProductVariant>> {
        const variant = await this.variantRepository.findById(input.id);
        if (!variant) {
            return ResultHelper.failure('Variant not found', ErrorCode.NOT_FOUND);
        }

        const previousStock = variant.stock;

        if (input.sku && input.sku !== variant.sku) {
            const existing = await this.variantRepository.findBySku(input.sku);
            if (existing) {
                return ResultHelper.failure('SKU already exists', ErrorCode.CONFLICT);
            }
            variant.sku = input.sku;
        }

        if (input.name) variant.name = input.name;
        if (input.attributes) variant.attributes = input.attributes;
        if (input.price !== undefined) variant.price = input.price;
        if (input.stock !== undefined) variant.stock = input.stock;
        if (input.compareAtPrice !== undefined) variant.compareAtPrice = input.compareAtPrice;
        if (input.lowStockThreshold !== undefined) variant.lowStockThreshold = input.lowStockThreshold;
        if (input.images) variant.images = input.images;
        if (input.isActive !== undefined) variant.isActive = input.isActive;
        if (input.isDefault !== undefined) variant.isDefault = input.isDefault; // see CreateUseCase note on default logic

        variant.updatedAt = new Date();

        const updated = await this.variantRepository.update(variant);

        // Emit Stock Events if needed
        const newStock = updated.stock;
        if (newStock !== previousStock) {
            const product = await this.productRepository.findById(updated.productId);
            if (product) {
                if (newStock === 0 && previousStock > 0) {
                    await this.eventEmitter.emit(new VariantOutOfStockEvent({
                        variantId: updated.id,
                        productId: product.id,
                        productName: product.name,
                        variantName: updated.name,
                        sku: updated.sku
                    }));
                } else if (newStock > 0 && newStock <= updated.lowStockThreshold && previousStock > updated.lowStockThreshold) {
                    await this.eventEmitter.emit(new VariantStockLowEvent({
                        variantId: updated.id,
                        productId: product.id,
                        productName: product.name,
                        variantName: updated.name,
                        sku: updated.sku,
                        currentStock: newStock,
                        threshold: updated.lowStockThreshold
                    }));
                }
            }
        }

        return ResultHelper.success(updated);
    }
}
