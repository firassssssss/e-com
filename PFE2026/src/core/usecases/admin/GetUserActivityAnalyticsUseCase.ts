import { Service } from 'typedi';
import { db } from '../../../infrastructure/db/index.js';
import { sql } from 'drizzle-orm';

export interface ActivityPoint {
  date: string;
  views: number;
  searches: number;
  carts: number;
  wishlists: number;
}

@Service()
export class GetUserActivityAnalyticsUseCase {
  async execute(period: 'day' | 'week' | 'month' = 'week'): Promise<ActivityPoint[]> {
    const interval = period === 'day' ? '1 day' : period === 'week' ? '7 days' : '30 days';

    const rows = await db.execute(sql`
      SELECT
        DATE(created_at)::text                                   AS date,
        COUNT(*) FILTER (WHERE type = 'view')::int               AS views,
        COUNT(*) FILTER (WHERE type = 'search')::int             AS searches,
        COUNT(*) FILTER (WHERE type = 'cart')::int               AS carts,
        COUNT(*) FILTER (WHERE type = 'wishlist')::int           AS wishlists
      FROM user_signals
      WHERE created_at >= NOW() - INTERVAL '${sql.raw(interval)}'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    return rows.rows as ActivityPoint[];
  }
}