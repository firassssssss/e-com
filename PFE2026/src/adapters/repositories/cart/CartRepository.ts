import { Service } from 'typedi';
import { ICartRepository } from '../../../core/repositories/ICartRepository.js';
import { Cart } from '../../../core/entities/Cart.js';
import { getDb } from '../../../infrastructure/db/index.js';
import { carts } from '../../../infrastructure/db/schema/carts.js';
import { eq } from 'drizzle-orm';
import { CartMapper } from './mappers/CartMapper.js';

@Service()
export class CartRepository implements ICartRepository {
    async findByUserId(userId: string): Promise<Cart | null> {
        const result = await getDb().select().from(carts).where(eq(carts.userId, userId));
        return result[0] ? CartMapper.toDomain(result[0]) : null;
    }

    async create(cart: Cart): Promise<Cart> {
        const dbCart = CartMapper.toPersistence(cart);
        const result = await getDb().insert(carts).values(dbCart).returning();
        return CartMapper.toDomain(result[0]);
    }

    async update(cart: Cart): Promise<Cart> {
        const dbCart = CartMapper.toPersistence(cart);
        const result = await getDb()
            .update(carts)
            .set(dbCart)
            .where(eq(carts.id, cart.id))
            .returning();
        return CartMapper.toDomain(result[0]);
    }

    async clearCart(userId: string): Promise<void> {
        await getDb().delete(carts).where(eq(carts.userId, userId));
    }
}
