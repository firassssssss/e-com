

import { JsonController, Get, Authorized, Res, Patch, Param, Body, Delete, Post, QueryParam } from 'routing-controllers';
import { Response } from 'express';
import { Service, Inject } from 'typedi';
import { ragClient } from '../../infrastructure/services/RagHttpsClient.js';
import { IListUsersUseCase } from '../../core/usecases/admin/ListUsersUseCase.js';
import { IUpdateUserRoleUseCase } from '../../core/usecases/admin/UpdateUserRoleUseCase.js';
import { ISuspendUserUseCase } from '../../core/usecases/admin/SuspendUserUseCase.js';
import { ICreateProductUseCase } from '../../core/usecases/product/CreateProductUseCase.js';
import { IUpdateProductUseCase } from '../../core/usecases/product/UpdateProductUseCase.js';
import { IDeleteProductUseCase } from '../../core/usecases/product/DeleteProductUseCase.js';
import { IListProductsUseCase } from '../../core/usecases/product/ListProductsUseCase.js';
import { GetChatHealthUseCase } from '../../core/usecases/admin/GetChatHealthUseCase.js';
import { GetUserActivityAnalyticsUseCase } from '../../core/usecases/admin/GetUserActivityAnalyticsUseCase.js';
import { GetUserGraphUseCase } from '../../core/usecases/admin/GetUserGraphUseCase.js';
import { UserRole } from '../../core/types/UserRole.js';
import { CreateProductDto } from '../dtos/product/CreateProductDto.js';
import { db } from '../../infrastructure/db/index.js';
import { conversationLogs } from '../../infrastructure/db/schema/conversationLogs.js';
import { eq, desc, sql } from 'drizzle-orm';
import { userSignals } from '../../infrastructure/db/schema/userSignals.js';

class UpdateRoleDto {
  role!: UserRole;
}

const SUSPICIOUS_PATTERNS = [
  /<script/i, /javascript:/i, /onerror/i, /onload/i,
  /SELECT.*FROM/i, /UNION/i, /DROP/i, /--/i,
  /\.\.\/\.\./i, /etc\/passwd/i,
];

function isSuspicious(msg: string): boolean {
  return SUSPICIOUS_PATTERNS.some(p => p.test(msg));
}

@JsonController('/admin')
@Service()
export class AdminController {
  @Inject('IListUsersUseCase')
  private listUsersUseCase!: IListUsersUseCase;

  @Inject('IUpdateUserRoleUseCase')
  private updateUserRoleUseCase!: IUpdateUserRoleUseCase;

  @Inject('ISuspendUserUseCase')
  private suspendUserUseCase!: ISuspendUserUseCase;

  @Inject('IListProductsUseCase')
  private listProductsUseCase!: IListProductsUseCase;

  @Inject('ICreateProductUseCase')
  private createProductUseCase!: ICreateProductUseCase;

  @Inject('IUpdateProductUseCase')
  private updateProductUseCase!: IUpdateProductUseCase;

  @Inject('IDeleteProductUseCase')
  private deleteProductUseCase!: IDeleteProductUseCase;

  @Inject('IGetChatHealthUseCase')
  private getChatHealthUseCase!: GetChatHealthUseCase;

  @Inject('IGetUserActivityAnalyticsUseCase')
  private getAnalyticsUseCase!: GetUserActivityAnalyticsUseCase;

  @Inject('IGetUserGraphUseCase')
  private getUserGraphUseCase!: GetUserGraphUseCase;

  // --- Existing routes (unchanged) ------------------------------------------

  @Authorized(['admin', 'super_admin'])
  @Get('/ping')
  async ping(@Res() res: Response) {
    return res.json({ success: true, message: 'Admin access granted' });
  }

  @Authorized(['admin', 'super_admin'])
  @Get('/users')
  async getUsers(@Res() res: Response) {
    const users = await this.listUsersUseCase.execute();
    return res.json({ success: true, data: users });
  }

  @Authorized(['super_admin'])
  @Patch('/users/:userId/role')
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() body: UpdateRoleDto,
    @Res() res: Response
  ) {
    const success = await this.updateUserRoleUseCase.execute(userId, body.role);
    return res.json({ success });
  }

  @Authorized(['super_admin'])
  @Delete('/users/:userId')
  async suspendUser(@Param('userId') userId: string, @Res() res: Response) {
    const success = await this.suspendUserUseCase.execute(userId);
    return res.json({ success });
  }

  @Authorized(['admin', 'super_admin'])
  @Get('/products')
  async getProducts(@Res() res: Response) {
    const result = await this.listProductsUseCase.execute({});
    return res.json(result);
  }

  @Authorized(['admin', 'super_admin'])
  @Post('/products')
  async createProduct(@Body() dto: CreateProductDto, @Res() res: Response) {
    const result = await this.createProductUseCase.execute(dto);
    return res.json(result);
  }

  @Authorized(['admin', 'super_admin'])
  @Patch('/products/:productId')
  async updateProduct(@Param('productId') productId: string, @Body() dto: any, @Res() res: Response) {
    const result = await this.updateProductUseCase.execute({ id: productId, ...dto });
    return res.json(result);
  }

  @Authorized(['super_admin'])
  @Delete('/products/:productId')
  async deleteProduct(@Param('productId') productId: string, @Res() res: Response) {
    const result = await this.deleteProductUseCase.execute(productId);
    return res.json(result);
  }

  @Authorized(['admin', 'super_admin'])
  @Get('/chat/health')
  async getChatHealth(@Res() res: Response) {
    const metrics = await this.getChatHealthUseCase.execute();
    return res.json({ success: true, data: metrics });
  }

  @Authorized(['admin', 'super_admin'])
  @Get('/chat/health/stream')
  async streamChatHealth(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const send = (data: any) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    const interval = setInterval(async () => {
      try { send(await this.getChatHealthUseCase.execute()); }
      catch { send({ error: 'Failed to fetch health data' }); }
    }, 5000);
    res.on('close', () => clearInterval(interval));
  }

  @Authorized(['admin', 'super_admin'])
  @Get('/analytics/activity')
  async getActivityAnalytics(@Res() res: Response, @QueryParam('period') period: string = 'week') {
    const data = await this.getAnalyticsUseCase.execute(period as any);
    return res.json({ success: true, data });
  }

  @Authorized(['admin', 'super_admin'])
  @Get('/analytics/activity/stream')
  async streamActivity(@Res() res: Response, @QueryParam('period') period: string = 'week') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const send = (data: any) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    const interval = setInterval(async () => {
      try { send(await this.getAnalyticsUseCase.execute(period as any)); }
      catch { send({ error: 'Failed to fetch analytics' }); }
    }, 10000);
    res.on('close', () => clearInterval(interval));
  }

  @Authorized(['admin', 'super_admin'])
  @Get('/graph/users')
  async getUserGraph(@Res() res: Response) {
    const graph = await this.getUserGraphUseCase.execute();
    return res.json({ success: true, data: graph });
  }

  // --- Chat: aggregated user list --------------------------------------------
  // Returns one row per unique (user_id, session_id) pair so the admin can
  // browse who chatted, how many messages they sent, and whether any looked
  // suspicious ï¿½ without loading full message bodies.

  @Authorized(['admin', 'super_admin'])
  @Get('/chat/users')
  async getChatUsers(
    @Res() res: Response,
    @QueryParam('days') days: number = 30,
  ) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // One SQL round-trip: aggregate per (user_id, session_id) + suspicious flag
    const result = await db.execute(sql`
      SELECT
        cl.user_id,
        cl.session_id,
        u.name                                                   AS user_name,
        u.email                                                  AS user_email,
        COUNT(*)::int                                            AS message_count,
        MAX(cl.created_at)                                       AS last_active,
        COUNT(CASE WHEN
          cl.user_message ~* '<script|javascript:|onerror|onload|SELECT .{1,30} FROM|UNION |DROP |\.\.\/|etc/passwd'
          THEN 1 END)::int                                       AS suspicious_count
      FROM conversation_logs cl
      LEFT JOIN "user" u ON u.id = cl.user_id
      WHERE cl.created_at >= ${since}
      GROUP BY cl.user_id, cl.session_id, u.name, u.email
      ORDER BY last_active DESC
      LIMIT 200
    `);

    const rows = result.rows as Array<{
      user_id:          string | null;
      session_id:       string;
      user_name:        string | null;
      user_email:       string | null;
      message_count:    number;
      last_active:      string;
      suspicious_count: number;
    }>;

    const data = rows.map((r) => ({
      userId:        r.user_id ?? null,
      sessionId:     r.session_id,
      userName:      r.user_name ?? null,
      userEmail:     r.user_email ?? null,
      messageCount:  r.message_count,
      lastActive:    r.last_active,
      hasSuspicious: r.suspicious_count > 0,
      identifier:    r.user_name ?? r.user_email ?? r.user_id ?? `anon:${String(r.session_id).slice(-10)}`,
      isAnon:        !r.user_id,
    }));

    return res.json({ success: true, data });
  }

  // --- Chat: messages (supports userId OR sessionId filter) -----------------

  @Authorized(['admin', 'super_admin'])
  @Get('/chat/messages')
  async getChatMessages(
    @Res() res: Response,
    @QueryParam('userId')        userId?: string,
    @QueryParam('sessionId')     sessionId?: string,
    @QueryParam('suspiciousOnly') suspiciousOnly?: boolean,
    @QueryParam('limit')         limit: number = 100,
  ) {
    const condition = userId
      ? eq(conversationLogs.userId, userId)
      : sessionId
      ? eq(conversationLogs.sessionId, sessionId)
      : undefined;

    const logs = await db
      .select()
      .from(conversationLogs)
      .where(condition)
      .orderBy(desc(conversationLogs.createdAt))
      .limit(limit);

    const enriched = logs.map(log => ({
      ...log,
      botMessages: log.botMessages as Array<{ text: string; confidence?: number }>,
      suspicious: isSuspicious(log.userMessage),
      createdAt:  log.createdAt.toISOString(),
    }));

    const result = suspiciousOnly ? enriched.filter(l => l.suspicious) : enriched;
    return res.json({ success: true, data: result });
  }

  // --- User activity signals -------------------------------------------------

  @Authorized(['admin', 'super_admin'])
  @Get('/users/:userId/activity')
  async getUserActivity(@Param('userId') userId: string, @Res() res: Response) {
    const signals = await db
      .select()
      .from(userSignals)
      .where(eq(userSignals.userId, userId))
      .orderBy(desc(userSignals.createdAt))
      .limit(200);

    const summary = {
      views:         signals.filter(s => s.type === 'view').length,
      searches:      signals.filter(s => s.type === 'search').length,
      carts:         signals.filter(s => s.type === 'cart').length,
      wishlists:     signals.filter(s => s.type === 'wishlist').length,
      recentSignals: signals.slice(0, 50),
    };
    return res.json({ success: true, data: summary });
  }

  // --- User chat (by userId) -------------------------------------------------
  // Kept for backward compat ï¿½ frontend now uses /chat/messages?userId=

  @Authorized(['admin', 'super_admin'])
  @Get('/users/:userId/chat')
  async getUserChatMessages(@Param('userId') userId: string, @Res() res: Response) {
    const logs = await db
      .select()
      .from(conversationLogs)
      .where(eq(conversationLogs.userId, userId))
      .orderBy(desc(conversationLogs.createdAt))
      .limit(100);

    const enriched = logs.map(log => ({
      ...log,
      botMessages: log.botMessages as Array<{ text: string; confidence?: number }>,
      suspicious:  isSuspicious(log.userMessage),
      createdAt:   log.createdAt.toISOString(),
    }));

    return res.json({ success: true, data: enriched });
  }
  // â”€â”€â”€ Analytics: KPI overview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Authorized(['admin', 'super_admin'])
  @Get('/analytics/overview')
  async getAnalyticsOverview(@Res() res: Response) {
    const [usersResult, ordersResult, activeResult] = await Promise.all([
      db.execute(sql`SELECT COUNT(*)::int AS count FROM "user"`),
      db.execute(sql`
        SELECT
          COUNT(*)::int                                    AS total_orders,
          COALESCE(SUM(total_amount::numeric), 0)::float   AS total_revenue
        FROM orders
      `),
      db.execute(sql`
        SELECT COUNT(DISTINCT user_id)::int AS active_users
        FROM user_signals
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `),
    ]);
    return res.json({
      success: true,
      data: {
        totalUsers:    (usersResult.rows[0]  as any).count,
        totalOrders:   (ordersResult.rows[0] as any).total_orders,
        totalRevenue:  (ordersResult.rows[0] as any).total_revenue,
        activeUsers7d: (activeResult.rows[0] as any).active_users,
      },
    });
  }

  // â”€â”€â”€ Analytics: per-user signal summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Authorized(['admin', 'super_admin'])
  @Get('/analytics/users/summary')
  async getUsersActivitySummary(@Res() res: Response) {
    const result = await db.execute(sql`
      SELECT
        u.id,
        u.name,
        u.email,
        COUNT(CASE WHEN s.type = 'view'     THEN 1 END)::int  AS views,
        COUNT(CASE WHEN s.type = 'search'   THEN 1 END)::int  AS searches,
        COUNT(CASE WHEN s.type = 'cart'     THEN 1 END)::int  AS carts,
        COUNT(CASE WHEN s.type = 'wishlist' THEN 1 END)::int  AS wishlists,
        COUNT(s.id)::int                                        AS total,
        MAX(s.created_at)                                       AS last_active
      FROM "user" u
      LEFT JOIN user_signals s ON s.user_id = u.id
      GROUP BY u.id, u.name, u.email
      ORDER BY total DESC
      LIMIT 100
    `);
    return res.json({ success: true, data: result.rows });
  }
  

  // â”€â”€ Chat quality / hallucination tracker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Tracks off-topic answers (hallucinations) and messages with no RAG context.
  // intent values written by ChatController:
  //   'off_topic'       â€” user asked something unrelated to skincare/beauty
  //   'no_rag_context'  â€” skincare question but RAG returned 0 products
  //   'skincare'        â€” normal flow, RAG returned results

  @Authorized(['admin', 'super_admin'])
  @Get('/chat/quality')
  async getChatQuality(
    @Res() res: Response,
    @QueryParam('days') days: number = 30,
  ) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await db.execute(sql`
      SELECT
        COALESCE(intent, 'unknown')                         AS intent,
        COUNT(*)::int                                       AS count,
        MIN(created_at)                                     AS first_seen,
        MAX(created_at)                                     AS last_seen
      FROM conversation_logs
      WHERE created_at >= ${since}
      GROUP BY intent
      ORDER BY count DESC
    `);

    const offTopicLogs = await db
      .select()
      .from(conversationLogs)
      .where(eq(conversationLogs.intent, 'off_topic'))
      .orderBy(desc(conversationLogs.createdAt))
      .limit(50);

    const noRagLogs = await db
      .select()
      .from(conversationLogs)
      .where(eq(conversationLogs.intent, 'no_rag_context'))
      .orderBy(desc(conversationLogs.createdAt))
      .limit(50);

    return res.json({
      success: true,
      data: {
        summary:        result.rows,
        offTopicSample: offTopicLogs.map(l => ({
          id:          l.id,
          message:     l.userMessage,
          userId:      l.userId,
          createdAt:   l.createdAt,
        })),
        noRagSample: noRagLogs.map(l => ({
          id:          l.id,
          message:     l.userMessage,
          userId:      l.userId,
          createdAt:   l.createdAt,
        })),
      },
    });
  }


  // â”€â”€ Chat quality / hallucination tracker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Tracks off-topic answers (hallucinations) and messages with no RAG context.
  // intent values written by ChatController:
  //   'off_topic'       â€” user asked something unrelated to skincare/beauty
  //   'no_rag_context'  â€” skincare question but RAG returned 0 products
  //   'skincare'        â€” normal flow, RAG returned results

  // ── Analytics: signals breakdown (chatbot vs UI) ────────────────────────
  @Authorized(['admin', 'super_admin'])
  @Get('/analytics/signals/breakdown')
  async getSignalsBreakdown(
    @Res() res: Response,
    @QueryParam('days') days: number = 7,
  ) {
    const breakdown = await db.execute(sql`
      SELECT
        type,
        COUNT(*)::int                  AS count,
        COUNT(DISTINCT user_id)::int   AS unique_users
      FROM user_signals
      WHERE created_at >= NOW() - (${days} || ' days')::interval
      GROUP BY type
      ORDER BY count DESC
    `);

    const trend = await db.execute(sql`
      SELECT
        DATE(created_at)::text  AS date,
        type,
        COUNT(*)::int           AS count
      FROM user_signals
      WHERE created_at >= NOW() - (${days} || ' days')::interval
      GROUP BY DATE(created_at), type
      ORDER BY date ASC
    `);

    return res.json({
      success: true,
      data: {
        breakdown: breakdown.rows,
        trend:     trend.rows,
      },
    });
  }

  // ── RAG reindex ────────────────────────────────────────────────────────────
  @Authorized(['admin', 'super_admin'])
  @Post('/rag/reindex')
  async ragReindex(@Res() res: Response) {
    try {
      const result = await ragClient.reindex();
      return res.json({ success: true, data: result });
    } catch (e: any) {
      return res.status(503).json({ success: false, error: 'RAG service unavailable', detail: e.message });
    }
  }

}
