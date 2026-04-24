import { Service, Inject } from 'typedi';
import { Result, ResultHelper } from '../../common/Result.js';
import { Product } from '../../entities/Product.js';
import { IProductRepository } from '../../repositories/IProductRepository.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateProductInput {
    name: string;
    description: string;
    price: number;
    categoryId: string;
    brand: string;
    sku: string;
    stock: number;
    images: string[];
    ingredients?: string[];
    skinType?: string[];
}

export interface ICreateProductUseCase {
    execute(input: CreateProductInput): Promise<Result<Product>>;
}

@Service()
export class CreateProductUseCase implements ICreateProductUseCase {
    constructor(
        @Inject('IProductRepository')
        private productRepository: IProductRepository
    ) { }

    /**
     * Creates a new product
     * @param input - Product data
     * @returns Result with created product
     */
    async execute(input: CreateProductInput): Promise<Result<Product>> {
        const product = new Product(
            uuidv4(),
            input.name,
            input.description,
            input.price,
            input.categoryId,
            input.brand,
            input.sku,
            input.stock,
            input.images,
            input.ingredients,
            input.skinType,
            true, // isActive
            false, // hasVariants
            0, // averageRating
            0, // reviewCount
            new Date(),
            new Date()
        );

        const createdProduct = await this.productRepository.create(product);
        return ResultHelper.success(createdProduct);
    }
}
