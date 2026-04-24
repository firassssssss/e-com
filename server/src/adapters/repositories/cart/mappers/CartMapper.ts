import { Cart, CartItem } from '../../../../core/entities/Cart.js';
import { carts } from '../../../../infrastructure/db/schema/carts.js';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

type DbCart = InferSelectModel<typeof carts>;
type NewDbCart = InferInsertModel<typeof carts>;

export class CartMapper {
    static toDomain(dbCart: DbCart): Cart {
        return new Cart(
            dbCart.id,
            dbCart.userId,
            (dbCart.items as CartItem[]) || [],
            dbCart.createdAt,
            dbCart.updatedAt
        );
    }

    static toPersistence(cart: Cart): NewDbCart {
        return {
            id: cart.id,
            userId: cart.userId,
            items: cart.items,
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt,
        };
    }
}
