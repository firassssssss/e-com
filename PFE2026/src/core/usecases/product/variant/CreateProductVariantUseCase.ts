import { Service, Inject } from 'typedi';
import { Result, ResultHelper, ErrorCode } from '../../../common/Result.js';
import { ProductVariant, VariantAttributes } from '../../../entities/ProductVariant.js';
import { IProductVariantRepository } from '../../../repositories/IProductVariantRepository.js';
import { IProductRepository } from '../../../repositories/IProductRepository.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateProductVariantInput {
    productId: string;
    sku: string;
    name: string;
    attributes: VariantAttributes;
    price: number;
    stock: number;
    compareAtPrice?: number;
    lowStockThreshold?: number;
    images?: string[];
    isActive?: boolean;
    isDefault?: boolean;
}

export interface ICreateProductVariantUseCase {
    execute(input: CreateProductVariantInput): Promise<Result<ProductVariant>>;
}

@Service()
export class CreateProductVariantUseCase implements ICreateProductVariantUseCase {
    constructor(
        @Inject('IProductVariantRepository') private variantRepository: IProductVariantRepository,
        @Inject('IProductRepository') private productRepository: IProductRepository
    ) { }

    async execute(input: CreateProductVariantInput): Promise<Result<ProductVariant>> {
        // 1. Check if product exists
        const product = await this.productRepository.findById(input.productId);
        if (!product) {
            return ResultHelper.failure('Product not found', ErrorCode.NOT_FOUND);
        }

        // 2. Check SKU uniqueness
        const existing = await this.variantRepository.findBySku(input.sku);
        if (existing) {
            return ResultHelper.failure('SKU already exists', ErrorCode.CONFLICT);
        }

        // 3. Create entity
        const variant = new ProductVariant(
            uuidv4(),
            input.productId,
            input.sku,
            input.name,
            input.attributes,
            input.price,
            input.compareAtPrice || null,
            input.stock,
            input.lowStockThreshold || 10,
            input.images || [],
            input.isActive ?? true,
            input.isDefault || false
        );

        // 4. Handle default Logic: if new one is default, unset others?
        // Repository likely handles saving, but logic for "only one default" should be in use case or domain service.
        // Ideally we assume frontend handles this or we run an update. 
        // For now simple implementation.

        // 5. Update Product hasVariants flag if false
        if (!product.hasVariants) {
            product.hasVariants = true;
            // Optionally clear product price/stock if migrating to variants?
            // Or keep as fallback. Let's just set flag.
            await this.productRepository.update(product);
        }

        const created = await this.variantRepository.create(variant);

        return ResultHelper.success(created);
    }
}
