import { readFileSync, writeFileSync } from "fs";
const f = "C:/e com/PFE2026/src/api/controllers/AdminController.ts";
let c = readFileSync(f, "utf8");

// ── Fix 1: activeUsers7d — count across signals + chat, not just signals ───
c = c.replace(
  `db.execute(sql\`
        SELECT COUNT(DISTINCT user_id)::int AS active_users
        FROM user_signals
        WHERE created_at >= NOW() - INTERVAL '7 days'
      \`),`,
  `db.execute(sql\`
        SELECT COUNT(DISTINCT user_id)::int AS active_users
        FROM (
          SELECT user_id FROM user_signals
          WHERE created_at >= NOW() - INTERVAL '7 days' AND user_id IS NOT NULL
          UNION
          SELECT user_id FROM conversation_logs
          WHERE created_at >= NOW() - INTERVAL '7 days' AND user_id IS NOT NULL
        ) t
      \`),`
);

// ── Fix 2: getChatQuality — add orderGapSample + langBreakdown ─────────────
c = c.replace(
  `    const offTopicLogs = await db
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
    });`,
  `    const offTopicLogs = await db
      .select()
      .from(conversationLogs)
      .where(eq(conversationLogs.intent, 'off_topic'))
      .orderBy(desc(conversationLogs.createdAt))
      .limit(100);

    const noRagLogs = await db
      .select()
      .from(conversationLogs)
      .where(eq(conversationLogs.intent, 'no_rag_context'))
      .orderBy(desc(conversationLogs.createdAt))
      .limit(50);

    // Language breakdown from recent logs
    const recentForLang = await db
      .select({ msg: conversationLogs.userMessage })
      .from(conversationLogs)
      .where(gte(conversationLogs.createdAt, since))
      .limit(300);
    const langBreakdown = { arabic: 0, french: 0, english: 0, other: 0 };
    for (const { msg } of recentForLang) {
      if (/[\u0600-\u06FF]/.test(msg))                                             langBreakdown.arabic++;
      else if (/[àâäéèêëîïôùûü]|bonjour|merci|s[eé]rum|peau/i.test(msg))         langBreakdown.french++;
      else if (/[a-zA-Z]/.test(msg))                                               langBreakdown.english++;
      else                                                                           langBreakdown.other++;
    }

    const ORDER_RE = /order|track|shipping|deliver|ORD-|where.*my|status.*order/i;
    const toSample = (l: any) => ({ id: l.id, message: l.userMessage, userId: l.userId, createdAt: l.createdAt });

    return res.json({
      success: true,
      data: {
        summary:          result.rows,
        offTopicSample:   offTopicLogs.filter(l => !ORDER_RE.test(l.userMessage)).map(toSample),
        noRagSample:      noRagLogs.map(toSample),
        orderGapSample:   offTopicLogs.filter(l =>  ORDER_RE.test(l.userMessage)).map(toSample),
        langBreakdown,
      },
    });`
);

// ── Fix 3: Add RAG health proxy route (before closing brace) ───────────────
c = c.replace(
  `  @Authorized(['admin', 'super_admin'])
  @Patch('/orders/:orderId/status')`,
  `  @Authorized(['admin', 'super_admin'])
  @Get('/rag/health')
  async getRagHealth(@Res() res: Response) {
    try {
      const ragUrl = (process.env.RAG_URL || 'http://localhost:8001').replace(/\\/$/, '');
      const r = await fetch(\`\${ragUrl}/health\`);
      const data = await r.json();
      return res.json({ success: true, data });
    } catch {
      return res.json({ success: true, data: { status: 'unavailable', vectors: 0, ml_classifier: 'unavailable' } });
    }
  }

  @Authorized(['admin', 'super_admin'])
  @Patch('/orders/:orderId/status')`
);

writeFileSync(f, c, "utf8");
const u = readFileSync(f, "utf8");
console.log("activeUsers fix:", u.includes("UNION"));
console.log("orderGapSample:", u.includes("orderGapSample"));
console.log("langBreakdown:", u.includes("langBreakdown"));
console.log("RAG health route:", u.includes("getRagHealth"));
