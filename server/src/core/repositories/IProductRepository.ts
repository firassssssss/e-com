import { Product } from '../entities/Product.js';

export interface ProductFilterInput {
  search?:     string;
  categoryId?: string;
  skinType?:   string;
}

export interface IProductRepository {
    findById(id: string): Promise<Product | null>;
    findAll(): Promise<Product[]>;
    /** Filtered query — executed at DB level, never loads full catalog. */
    findFiltered(input: ProductFilterInput): Promise<Product[]>;
    create(product: Product): Promise<Product>;
    update(product: Product): Promise<Product>;
    delete(id: string): Promise<void>;
}
