import { Service } from 'typedi';
import { db } from '../../../infrastructure/db/index.js';
import { userSignals } from '../../../infrastructure/db/schema/userSignals.js';
import { products } from '../../../infrastructure/db/schema/products.js';
import { eq, and, gte, inArray } from 'drizzle-orm';
import { handleProfileUpdate } from '../../../infrastructure/services/ProfileIntelligenceService.js';
import { redis } from '../../../infrastructure/redis/index.js';

export type SignalType = 'view' | 'search' | 'cart' | 'wishlist' | 'chat_rag' | 'click' | 'browse';

export interface TrackSignalRequest {
  userId: string;
  type: SignalType;
  productId?: string;
  searchQuery?: string;
}

const WEIGHTS: Record<SignalType, number> = {
  view: 1, browse: 1, click: 1, search: 2, cart: 4, wishlist: 3, chat_rag: 2,
};

const UI_PROFILE_THRESHOLD = 5;
const UI_PROFILE_COOLDOWN  = 3600;

@Service()
export class TrackSignalUseCase {
  async execute(req: TrackSignalRequest) {
    try {
      await db.insert(userSignals).values({
        userId:      req.userId,
        type:        req.type,
        productId:   req.productId ?? null,
        searchQuery: req.searchQuery ?? null,
        weight:      WEIGHTS[req.type] ?? 1,
      });
      if (req.productId && req.userId) {
        setImmediate(() => this.analyzeUIProfile(req.userId, req.productId!).catch(() => {}));
      }
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  private async analyzeUIProfile(userId: string, productId: string) {
    const cooldownKey = "ui_profile_check:" + userId;
    const already = await redis.get(cooldownKey);
    if (already) return;
    await redis.setex(cooldownKey, UI_PROFILE_COOLDOWN, "1");

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSignals = await db
      .select({ productId: userSignals.productId, weight: userSignals.weight })
      .from(userSignals)
      .where(and(eq(userSignals.userId, userId), gte(userSignals.createdAt, since)));

    if (recentSignals.length < 3) return;

    const signaledIds = [...new Set(recentSignals.map(s => s.productId).filter((x): x is string => !!x))];
    if (!signaledIds.length) return;

    const signaledProds = await db
      .select({ id: products.id, skinType: (products as any).skinType })
      .from(products)
      .where(inArray(products.id, signaledIds));

    const skinTypeScore: Record<string, number> = {};
    for (const signal of recentSignals) {
      const prod = signaledProds.find(p => p.id === signal.productId);
      const types: string[] = Array.isArray((prod as any)?.skinType) ? (prod as any).skinType : [];
      for (const t of types) {
        skinTypeScore[t] = (skinTypeScore[t] ?? 0) + (signal.weight ?? 1);
      }
    }

    const dominant = Object.entries(skinTypeScore).sort((a, b) => b[1] - a[1])[0];
    if (!dominant || dominant[1] < UI_PROFILE_THRESHOLD) return;

    await handleProfileUpdate(userId, {
      skinType: dominant[0],
      hairType: null,
      skinConcerns: [],
      confidence: 0.65,
    });
    await redis.del(`skin:${userId}`);
  }
}

