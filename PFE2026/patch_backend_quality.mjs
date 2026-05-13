import { readFileSync, writeFileSync } from "fs";
const f = "C:/e com/PFE2026/src/api/controllers/AdminController.ts";
let c = readFileSync(f, "utf8");

// ── Fix 1: replace getChatQuality return to include langBreakdown + orderGapSample
const OLD_RETURN = `    return res.json({
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
    });`;

const NEW_RETURN = `    // Language breakdown
    const recentForLang = await db
      .select({ msg: conversationLogs.userMessage })
      .from(conversationLogs)
      .where(gte(conversationLogs.createdAt, since))
      .limit(300);
    const langBreakdown = { arabic: 0, french: 0, english: 0, other: 0 };
    for (const { msg } of recentForLang) {
      if (/[\u0600-\u06FF]/.test(msg))                                           langBreakdown.arabic++;
      else if (/[àâäéèêëîïôùûü]|bonjour|merci|sérum|peau/i.test(msg))           langBreakdown.french++;
      else if (/[a-zA-Z]/.test(msg))                                             langBreakdown.english++;
      else                                                                         langBreakdown.other++;
    }

    const ORDER_RE = /order|track|shipping|deliver|ORD-|where.*my|status.*order/i;
    const toSample = (l: any) => ({ id: l.id, message: l.userMessage, userId: l.userId, createdAt: l.createdAt });

    return res.json({
      success: true,
      data: {
        summary:        result.rows,
        offTopicSample: offTopicLogs.filter(l => !ORDER_RE.test(l.userMessage)).map(toSample),
        noRagSample:    noRagLogs.map(toSample),
        orderGapSample: offTopicLogs.filter(l =>  ORDER_RE.test(l.userMessage)).map(toSample),
        langBreakdown,
      },
    });`;

if (c.includes(OLD_RETURN)) {
  c = c.replace(OLD_RETURN, NEW_RETURN);
  console.log("Fix 1 (langBreakdown + orderGapSample): OK");
} else {
  console.log("Fix 1: PATTERN NOT FOUND — check getChatQuality return block");
}

// ── Fix 2: add gte import if missing
if (!c.includes("gte(conversationLogs")) {
  // gte is already imported for orders, just need it used — should be fine
}

// ── Fix 3: add getRagHealth route before the orders route
const RAG_ANCHOR = `  @Authorized(['admin', 'super_admin'])
  @Get('/orders')`;

const RAG_ROUTE = `  @Authorized(['admin', 'super_admin'])
  @Get('/rag/health')
  async getRagHealth(@Res() res: Response) {
    try {
      const ragUrl = (process.env.RAG_URL || 'http://localhost:8001').replace(/\/$/, '');
      const r = await fetch(\`\${ragUrl}/health\`);
      const data = await r.json();
      return res.json({ success: true, data });
    } catch {
      return res.json({ success: true, data: { status: 'unavailable', vectors: 0, ml_classifier: 'unavailable' } });
    }
  }

  @Authorized(['admin', 'super_admin'])
  @Get('/orders')`;

if (c.includes(RAG_ANCHOR)) {
  c = c.replace(RAG_ANCHOR, RAG_ROUTE);
  console.log("Fix 2 (getRagHealth route): OK");
} else {
  console.log("Fix 2: ANCHOR NOT FOUND — orders route not where expected");
}

writeFileSync(f, c, "utf8");
const u = readFileSync(f, "utf8");
console.log("---");
console.log("langBreakdown in file:", u.includes("langBreakdown"));
console.log("orderGapSample in file:", u.includes("orderGapSample"));
console.log("getRagHealth in file:", u.includes("getRagHealth"));
