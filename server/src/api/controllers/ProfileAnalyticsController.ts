import { JsonController, Get, Action } from "routing-controllers";
import { Service } from "typedi";
import { redis } from "../../infrastructure/redis/index.js";

@JsonController("/admin/profile-analytics")
@Service()
export class ProfileAnalyticsController {

  @Get("/updates")
  async getProfileUpdates() {
    try {
      const raw = await (redis as any).lrange("profile_update_log", 0, 499);
      const entries = (Array.isArray(raw) ? raw : []).map((r: string) => {
        try { return JSON.parse(r); } catch { return null; }
      }).filter(Boolean);

      const bySource: Record<string, number> = {};
      const byField:  Record<string, number> = {};
      for (const e of entries) {
        bySource[e.source] = (bySource[e.source] ?? 0) + 1;
        Object.keys(e.changes ?? {}).forEach((f: string) => { byField[f] = (byField[f] ?? 0) + 1; });
      }
      return { total: entries.length, bySource, byField, recent: entries.slice(0, 20) };
    } catch {
      return { total: 0, bySource: {}, byField: {}, recent: [] };
    }
  }
}
