import { Product } from '../entities/Product.js';

export interface IProductRepository {
    findById(id: string): Promise<Product | null>;
    findAll(): Promise<Product[]>;
    create(product: Product): Promise<Product>;
    update(product: Product): Promise<Product>;
    delete(id: string): Promise<void>;
}
