// import { Service } from 'typedi';
// import { db } from '../../../infrastructure/db/index.js';
// import { userSignals } from '../../../infrastructure/db/schema/userSignals.js';
// import { user } from '../../../infrastructure/db/schema/auth.js';

// interface GraphNode {
//   id: string;
//   name: string;
//   activityScore: number;
// }

// interface GraphLink {
//   source: string;
//   target: string;
//   weight: number;
// }

// @Service()
// export class GetUserGraphUseCase {
//   async execute(): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
//     const users = await db.select({ id: user.id, name: user.name }).from(user);
//     const signals = await db.select().from(userSignals);

//     const userVectors: Record<string, Record<string, number>> = {};
//     for (const s of signals) {
//       if (!s.productId) continue;
//       if (!userVectors[s.userId]) userVectors[s.userId] = {};
//       userVectors[s.userId][s.productId] = (userVectors[s.userId][s.productId] || 0) + s.weight;
//     }

//     const nodes: GraphNode[] = users.map(u => ({
//       id: u.id,
//       name: u.name,
//       activityScore: Object.values(userVectors[u.id] || {}).reduce((a, b) => a + b, 0),
//     })).filter(n => n.activityScore > 0);

//     const links: GraphLink[] = [];
//     const nodeIds = nodes.map(n => n.id);
//     for (let i = 0; i < nodeIds.length; i++) {
//       for (let j = i + 1; j < nodeIds.length; j++) {
//         const vecA = userVectors[nodeIds[i]] || {};
//         const vecB = userVectors[nodeIds[j]] || {};
//         let dot = 0, normA = 0, normB = 0;
//         for (const key in vecA) {
//           dot += vecA[key] * (vecB[key] || 0);
//           normA += vecA[key] ** 2;
//         }
//         for (const key in vecB) normB += vecB[key] ** 2;
//         const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
//         if (similarity > 0.3) {
//           links.push({ source: nodeIds[i], target: nodeIds[j], weight: similarity });
//         }
//       }
//     }
//     return { nodes, links };
//   }
// }

import { Service } from 'typedi';
import { db } from '../../../infrastructure/db/index.js';
import { userSignals } from '../../../infrastructure/db/schema/userSignals.js';
import { orders } from '../../../infrastructure/db/schema/orders.js';
import { wishlistItems, wishlists } from '../../../infrastructure/db/schema/wishlists.js';
import { reviews } from '../../../infrastructure/db/schema/reviews.js';
import { conversationLogs } from '../../../infrastructure/db/schema/conversationLogs.js';
import { sql, isNotNull, eq } from 'drizzle-orm';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConnectionType =
  | 'product_interest'  // cosine similarity on browse/signal vectors
  | 'skin_type'         // same skinType from onboarding
  | 'hair_type'         // same hairType from onboarding
  | 'skin_concern'      // same skinConcerns from onboarding
  | 'discovery'         // same discoverySource from onboarding
  | 'co_purchase'       // bought the same product
  | 'co_wishlist'       // wishlisted the same product
  | 'co_review'         // reviewed the same product
  | 'chatbot_user';     // both used the chatbot

export interface GraphNode {
  id:              string;
  name:            string;
  activityScore:   number;
  role:            string;
  skinType:        string | null;
  hairType:        string | null;
  skinConcerns:    string | null;
  discoverySource: string | null;
  ordersCount:     number;
  chatCount:       number;
}

export interface GraphLink {
  source:      string;
  target:      string;
  weight:      number;        // 0–1, max across all types
  types:       ConnectionType[];
  primaryType: ConnectionType; // strongest / most specific
}

// ─── Priority order: most specific → least specific ──────────────────────────
const TYPE_PRIORITY: ConnectionType[] = [
  'co_purchase',
  'co_wishlist',
  'co_review',
  'product_interest',
  'skin_type',
  'skin_concern',
  'hair_type',
  'discovery',
  'chatbot_user',
];

function pickPrimary(types: ConnectionType[]): ConnectionType {
  for (const t of TYPE_PRIORITY) {
    if (types.includes(t)) return t;
  }
  return types[0];
}

// ─── Jaccard similarity between two sets ─────────────────────────────────────
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const x of a) if (b.has(x)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ─── Cosine similarity between two sparse vectors ────────────────────────────
function cosine(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0, normA = 0, normB = 0;
  for (const k in a) { dot += a[k] * (b[k] || 0); normA += a[k] ** 2; }
  for (const k in b) normB += b[k] ** 2;
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── Use case ─────────────────────────────────────────────────────────────────
@Service()
export class GetUserGraphUseCase {
  async execute(): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {

    // ── 1. All users with profile data ──────────────────────────────────────
    const userRows = await db.execute<{
      id: string; name: string; role: string;
      skin_type: string | null; hair_type: string | null;
      skin_concerns: string | null; discovery_source: string | null;
    }>(sql`
      SELECT
        id, name, role,
        skin_type, hair_type, skin_concerns, discovery_source
      FROM "user"
      ORDER BY created_at ASC
    `);
    const allUsers = userRows.rows;
    const userIds  = allUsers.map(u => u.id);

    // ── 2. Signal vectors for product-interest similarity ───────────────────
    const signalRows = await db.select().from(userSignals);

    const signalVectors: Record<string, Record<string, number>> = {};
    const activityScore: Record<string, number> = {};
    for (const s of signalRows) {
      if (!s.productId) continue;
      if (!signalVectors[s.userId]) signalVectors[s.userId] = {};
      signalVectors[s.userId][s.productId] =
        (signalVectors[s.userId][s.productId] || 0) + s.weight;
      activityScore[s.userId] = (activityScore[s.userId] || 0) + s.weight;
    }

    // ── 3. Purchased product sets (extract from JSONB items array) ──────────
    const purchaseRows = await db.execute<{ user_id: string; product_id: string }>(sql`
      SELECT
        user_id,
        COALESCE(elem->>'productId', elem->>'product_id') AS product_id
      FROM orders,
           jsonb_array_elements(items) AS elem
      WHERE COALESCE(elem->>'productId', elem->>'product_id') IS NOT NULL
    `);
    const purchaseSets: Record<string, Set<string>> = {};
    for (const r of purchaseRows.rows) {
      if (!purchaseSets[r.user_id]) purchaseSets[r.user_id] = new Set();
      purchaseSets[r.user_id].add(r.product_id);
    }
    const orderCounts: Record<string, number> = {};
    const orderCountRows = await db.execute<{ user_id: string; cnt: number }>(sql`
      SELECT user_id, COUNT(*)::int AS cnt FROM orders GROUP BY user_id
    `);
    for (const r of orderCountRows.rows) orderCounts[r.user_id] = r.cnt;

    // ── 4. Wishlisted product sets ───────────────────────────────────────────
    const wishRows = await db
      .select({ userId: wishlists.userId, productId: wishlistItems.productId })
      .from(wishlistItems)
      .innerJoin(wishlists, eq(wishlistItems.wishlistId, wishlists.id));
    const wishSets: Record<string, Set<string>> = {};
    for (const r of wishRows) {
      if (!wishSets[r.userId]) wishSets[r.userId] = new Set();
      wishSets[r.userId].add(r.productId);
    }

    // ── 5. Reviewed product sets ─────────────────────────────────────────────
    const reviewRows = await db
      .select({ userId: reviews.userId, productId: reviews.productId })
      .from(reviews);
    const reviewSets: Record<string, Set<string>> = {};
    for (const r of reviewRows) {
      if (!reviewSets[r.userId]) reviewSets[r.userId] = new Set();
      reviewSets[r.userId].add(r.productId);
    }

    // ── 6. Chatbot users set ─────────────────────────────────────────────────
    const chatRows = await db
      .select({ userId: conversationLogs.userId })
      .from(conversationLogs)
      .where(isNotNull(conversationLogs.userId));
    const chatUserSet: Set<string> = new Set(chatRows.map(r => r.userId!));
    const chatCounts: Record<string, number> = {};
    const chatCountRows = await db.execute<{ user_id: string; cnt: number }>(sql`
      SELECT user_id, COUNT(*)::int AS cnt
      FROM conversation_logs
      WHERE user_id IS NOT NULL
      GROUP BY user_id
    `);
    for (const r of chatCountRows.rows) chatCounts[r.user_id] = r.cnt;

    // ── 7. Build nodes (ALL users, no filter) ────────────────────────────────
    const nodes: GraphNode[] = allUsers.map(u => ({
      id:              u.id,
      name:            u.name,
      activityScore:   activityScore[u.id] || 0,
      role:            u.role,
      skinType:        u.skin_type,
      hairType:        u.hair_type,
      skinConcerns:    u.skin_concerns,
      discoverySource: u.discovery_source,
      ordersCount:     orderCounts[u.id] || 0,
      chatCount:       chatCounts[u.id]  || 0,
    }));

    // ── 8. Build edges (all pairs) ───────────────────────────────────────────
    const COSINE_THRESHOLD  = 0.25;
    const JACCARD_THRESHOLD = 0.05; // at least 1 shared product

    const links: GraphLink[] = [];

    for (let i = 0; i < userIds.length; i++) {
      for (let j = i + 1; j < userIds.length; j++) {
        const idA = userIds[i];
        const idB = userIds[j];
        const uA  = allUsers[i];
        const uB  = allUsers[j];

        const edgeTypes: ConnectionType[] = [];
        let   maxWeight = 0;

        // ── product interest (cosine on signal vectors) ──
        const sim = cosine(signalVectors[idA] || {}, signalVectors[idB] || {});
        if (sim >= COSINE_THRESHOLD) {
          edgeTypes.push('product_interest');
          maxWeight = Math.max(maxWeight, sim);
        }

        // ── co-purchase ──
        const purchJac = jaccard(purchaseSets[idA] || new Set(), purchaseSets[idB] || new Set());
        if (purchJac >= JACCARD_THRESHOLD) {
          edgeTypes.push('co_purchase');
          maxWeight = Math.max(maxWeight, purchJac);
        }

        // ── co-wishlist ──
        const wishJac = jaccard(wishSets[idA] || new Set(), wishSets[idB] || new Set());
        if (wishJac >= JACCARD_THRESHOLD) {
          edgeTypes.push('co_wishlist');
          maxWeight = Math.max(maxWeight, wishJac);
        }

        // ── co-review ──
        const revJac = jaccard(reviewSets[idA] || new Set(), reviewSets[idB] || new Set());
        if (revJac >= JACCARD_THRESHOLD) {
          edgeTypes.push('co_review');
          maxWeight = Math.max(maxWeight, revJac);
        }

        // ── skin type ──
        if (uA.skin_type && uB.skin_type && uA.skin_type === uB.skin_type) {
          edgeTypes.push('skin_type');
          maxWeight = Math.max(maxWeight, 0.7);
        }

        // ── hair type ──
        if (uA.hair_type && uB.hair_type && uA.hair_type === uB.hair_type) {
          edgeTypes.push('hair_type');
          maxWeight = Math.max(maxWeight, 0.5);
        }

        // ── skin concern ──
        if (uA.skin_concerns && uB.skin_concerns && uA.skin_concerns === uB.skin_concerns) {
          edgeTypes.push('skin_concern');
          maxWeight = Math.max(maxWeight, 0.6);
        }

        // ── discovery source ──
        if (uA.discovery_source && uB.discovery_source && uA.discovery_source === uB.discovery_source) {
          edgeTypes.push('discovery');
          maxWeight = Math.max(maxWeight, 0.4);
        }

        // ── chatbot users ──
        if (chatUserSet.has(idA) && chatUserSet.has(idB)) {
          edgeTypes.push('chatbot_user');
          maxWeight = Math.max(maxWeight, 0.35);
        }

        if (edgeTypes.length > 0) {
          links.push({
            source:      idA,
            target:      idB,
            weight:      maxWeight,
            types:       edgeTypes,
            primaryType: pickPrimary(edgeTypes),
          });
        }
      }
    }

    return { nodes, links };
  }
}