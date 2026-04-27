import { Service, Inject } from 'typedi';
import { IProductRepository } from '../../repositories/IProductRepository.js';
import { Product } from '../../entities/Product.js';

export interface UpdateProductInput {
  id: string;
  name?: string;
  description?: string;
  price?: number | null;
  categoryId?: string;
  brand?: string;
  sku?: string;
  stock?: number | null;
  images?: string[];
  ingredients?: string[];
  skinType?: string[];
  isActive?: boolean;
}

export interface IUpdateProductUseCase {
  execute(data: UpdateProductInput): Promise<{ success: boolean; data?: Product; error?: string }>;
}

@Service()
export class UpdateProductUseCase implements IUpdateProductUseCase {
  constructor(@Inject('IProductRepository') private repo: IProductRepository) {}

  async execute(data: UpdateProductInput): Promise<{ success: boolean; data?: Product; error?: string }> {
    const product = await this.repo.findById(data.id);
    if (!product) {
      return { success: false, error: `Product '${data.id}' not found` };
    }

    // Apply only the fields that were explicitly passed
    if (data.name        !== undefined) product.name        = data.name;
    if (data.description !== undefined) product.description = data.description;
    if (data.price       !== undefined) product.price       = data.price;
    if (data.categoryId  !== undefined) product.categoryId  = data.categoryId;
    if (data.brand       !== undefined) product.brand       = data.brand;
    if (data.sku         !== undefined) product.sku         = data.sku;
    if (data.stock       !== undefined) product.stock       = data.stock;
    if (data.images      !== undefined) product.images      = data.images;
    if (data.ingredients !== undefined) product.ingredients = data.ingredients;
    if (data.skinType    !== undefined) product.skinType    = data.skinType;
    if (data.isActive    !== undefined) product.isActive    = data.isActive;

    try {
      const updated = await this.repo.update(product);
      return { success: true, data: updated };
    } catch (err: any) {
      console.error('[UpdateProductUseCase] DB error:', err.message);
      return { success: false, error: 'Failed to update product' };
    }
  }
}
