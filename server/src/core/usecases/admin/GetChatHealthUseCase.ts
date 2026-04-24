import { Service } from 'typedi';
import { db } from '../../../infrastructure/db/index.js';
import { conversationLogs } from '../../../infrastructure/db/schema/conversationLogs.js';
import { chatFeedback } from '../../../infrastructure/db/schema/chatFeedback.js';
import { user } from '../../../infrastructure/db/schema/auth.js';
import { sql, gte, inArray } from 'drizzle-orm';

export interface HourlyBucket { hour: string; count: number; }

export interface ChatHealthMetrics {
  totalConversations: number;
  uniqueUsers: number;
  anonSessions: number;
  avgConfidence: number;
  hallucinationRate: number;
  negativeFeedbackRate: number;
  positiveFeedbackRate: number;
  totalFeedbacks: number;
  avgMessagesPerUser: number;
  intentBreakdown: Record<string, number>;
  hourlyActivity: HourlyBucket[];
  recentLogs: Array<{
    id: string;
    userMessage: string;
    botReply: string;
    confidence: number | null;
    feedback: number | null;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    createdAt: string;
  }>;
}

@Service()
export class GetChatHealthUseCase {
  async execute(): Promise<ChatHealthMetrics> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [logs, feedbacks] = await Promise.all([
      db.select().from(conversationLogs)
        .where(gte(conversationLogs.createdAt, oneDayAgo))
        .orderBy(sql`${conversationLogs.createdAt} DESC`)
        .limit(500),
      db.select().from(chatFeedback)
        .where(gte(chatFeedback.createdAt, oneDayAgo)),
    ]);

    const total = logs.length;
    const feedbackMap = new Map(feedbacks.map(f => [f.logId, f.rating]));

    const avgConfidence = total
      ? logs.reduce((s, l) => s + ((l.botMessages as any[])?.[0]?.confidence ?? 0.5), 0) / total
      : 0;

    const hallucinationCount = logs.filter(l => {
      const conf = (l.botMessages as any[])?.[0]?.confidence ?? 0.5;
      return conf < 0.7 && feedbackMap.get(l.id) === -1;
    }).length;

    const posCount = feedbacks.filter(f => f.rating === 1).length;
    const negCount = feedbacks.filter(f => f.rating === -1).length;

    const authUserIds = new Set(logs.filter(l => l.userId).map(l => l.userId!));
    const anonSessions = new Set(logs.filter(l => !l.userId).map(l => l.sessionId));
    const uniqueUsers = authUserIds.size + anonSessions.size;

    const intentBreakdown: Record<string, number> = {};
    for (const l of logs) {
      const k = l.intent ?? 'unclassified';
      intentBreakdown[k] = (intentBreakdown[k] ?? 0) + 1;
    }

    const hourlyMap = new Map<string, number>();
    for (const l of logs) {
      const d = new Date(l.createdAt);
      d.setMinutes(0, 0, 0);
      const key = d.toISOString();
      hourlyMap.set(key, (hourlyMap.get(key) ?? 0) + 1);
    }
    const hourlyActivity: HourlyBucket[] = Array.from(hourlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, count]) => ({ hour, count }));

    // Enrich recent logs with name + email via one extra query
    const recentRaw = logs.slice(0, 20);
    const uidsToFetch = [...new Set(recentRaw.filter(l => l.userId).map(l => l.userId!))];
    const userMap = new Map<string, { name: string; email: string }>();
    if (uidsToFetch.length) {
      const rows = await db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .where(inArray(user.id, uidsToFetch));
      for (const u of rows) userMap.set(u.id, { name: u.name, email: u.email });
    }

    const recentLogs = recentRaw.map(l => {
      const botMsg = (l.botMessages as any[])?.[0];
      const uInfo  = l.userId ? userMap.get(l.userId) : undefined;
      return {
        id:         l.id,
        userMessage: l.userMessage,
        botReply:   botMsg?.text ?? '',
        confidence: botMsg?.confidence ?? null,
        feedback:   feedbackMap.get(l.id) ?? null,
        userId:     l.userId,
        userName:   uInfo?.name  ?? null,
        userEmail:  uInfo?.email ?? null,
        createdAt:  l.createdAt.toISOString(),
      };
    });

    return {
      totalConversations: total,
      uniqueUsers,
      anonSessions: anonSessions.size,
      avgConfidence,
      hallucinationRate:     total ? (hallucinationCount / total) * 100 : 0,
      negativeFeedbackRate:  total ? (negCount / total) * 100 : 0,
      positiveFeedbackRate:  total ? (posCount / total) * 100 : 0,
      totalFeedbacks:        feedbacks.length,
      avgMessagesPerUser:    uniqueUsers ? total / uniqueUsers : 0,
      intentBreakdown,
      hourlyActivity,
      recentLogs,
    };
  }
}
