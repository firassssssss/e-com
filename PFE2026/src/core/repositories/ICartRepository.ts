import { Cart } from '../entities/Cart.js';

export interface ICartRepository {
    findByUserId(userId: string): Promise<Cart | null>;
    create(cart: Cart): Promise<Cart>;
    update(cart: Cart): Promise<Cart>;
    clearCart(userId: string): Promise<void>;
}
