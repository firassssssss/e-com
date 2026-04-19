import { Service } from 'typedi';
import { db } from '../../../infrastructure/db/index.js';
import { userSignals } from '../../../infrastructure/db/schema/userSignals.js';

export type SignalType = 'view' | 'search' | 'cart' | 'wishlist';

export interface TrackSignalRequest {
  userId: string;
  type: SignalType;
  productId?: string;
  searchQuery?: string;
}

const WEIGHTS: Record<SignalType, number> = {
  view: 1,
  search: 2,
  cart: 4,
  wishlist: 3,
};

@Service()
export class TrackSignalUseCase {
  async execute(req: TrackSignalRequest) {
    try {
      await db.insert(userSignals).values({
        userId: req.userId,
        type: req.type,
        productId: req.productId ?? null,
        searchQuery: req.searchQuery ?? null,
        weight: WEIGHTS[req.type],
      });
      return { success: true };
    } catch {
      return { success: false };
    }
  }
}