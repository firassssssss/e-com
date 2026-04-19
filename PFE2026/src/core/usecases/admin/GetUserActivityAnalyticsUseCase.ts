import { Service } from 'typedi';
import { db } from '../../../infrastructure/db/index.js';
import { userSignals } from '../../../infrastructure/db/schema/userSignals.js';
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
        DATE(created_at) as date,
        COUNT(*) FILTER (WHERE type = 'view') as views,
        COUNT(*) FILTER (WHERE type = 'search') as searches,
        COUNT(*) FILTER (WHERE type = 'cart') as carts,
        COUNT(*) FILTER (WHERE type = 'wishlist') as wishlists
      FROM user_signals
      WHERE created_at >= NOW() - INTERVAL '${sql.raw(interval)}'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    return rows.rows as ActivityPoint[];
  }
}
