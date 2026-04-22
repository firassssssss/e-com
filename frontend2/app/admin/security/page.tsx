"use client";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
  Shield, AlertTriangle, CheckCircle, RefreshCw,
  Lock, Eye, Zap, Database, Package, FileText,
  Activity, Bug, Server, Wifi, XCircle, Clock,
  TrendingUp, Users, MessageSquare
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ThreatMessage {
  id: string;
  sessionId: string;
  userId: string | null;
  userMessage: string;
  createdAt: string;
  suspicious: boolean;
}

interface ChatUser {
  userId: string | null;
  sessionId: string;
  userName: string | null;
  userEmail: string | null;
  messageCount: number;
  lastActive: string;
  hasSuspicious: boolean;
  identifier: string;
  isAnon: boolean;
}

interface Stats {
  total: number;
  suspicious: number;
  clean: number;
  rate: number;
  suspiciousUsers: number;
  totalSessions: number;
}

// ── OWASP Coverage Data (static — reflects your actual middleware) ─────────────
const OWASP_ITEMS = [
  {
    id: "A01",
    name: "Broken Access Control",
    status: "covered",
    file: "authenticationCheckers.ts",
    detail: "RBAC middleware + role-scoped routes on every admin endpoint",
    icon: Lock,
  },
  {
    id: "A02",
    name: "Cryptographic Failures",
    status: "covered",
    file: "BcryptPasswordHasher.ts",
    detail: "bcrypt hashing · JWT HS256 · HTTPS headers via Helmet",
    icon: Shield,
  },
  {
    id: "A03",
    name: "Injection (SQL · XSS · Prompt)",
    status: "covered",
    file: "sanitizeMiddleware.ts + promptInjectionGuard.ts",
    detail: "Drizzle ORM parameterised queries · sanitizeBody · 30-pattern injection guard on chatbot",
    icon: Bug,
  },
  {
    id: "A04",
    name: "Insecure Design",
    status: "patched",
    file: "bruteForceMiddleware_PATCHED.ts",
    detail: "Account-level lockout keyed by email — IP rotation bypass fixed",
    icon: Zap,
  },
  {
    id: "A05",
    name: "Security Misconfiguration",
    status: "covered",
    file: "helmetConfig.ts",
    detail: "8 security headers · CORS whitelist · X-Powered-By hidden · no stack traces in prod",
    icon: Server,
  },
  {
    id: "A06",
    name: "Vulnerable Components",
    status: "monitored",
    file: "package-lock.json",
    detail: "npm audit enforced before every deploy · Dependabot alerts enabled",
    icon: Package,
  },
  {
    id: "A07",
    name: "Auth & Session Failures",
    status: "covered",
    file: "tokenBlacklist.ts + OtpService.ts",
    detail: "better-auth · 2FA OTP via Nodemailer · Redis token blacklist on logout",
    icon: Eye,
  },
  {
    id: "A08",
    name: "Software & Data Integrity",
    status: "covered",
    file: "sanitizeMiddleware.ts",
    detail: "No eval() · parameterised queries · JSON.parse wrapped in try/catch everywhere",
    icon: Database,
  },
  {
    id: "A09",
    name: "Logging & Monitoring",
    status: "covered",
    file: "auditLogger.ts",
    detail: "15 security event types · IP + user-agent · append-only audit_logs table",
    icon: FileText,
  },
  {
    id: "A10",
    name: "Server-Side Request Forgery",
    status: "covered",
    file: "ssrfGuard.ts",
    detail: "URL allowlist · private IP block · DNS resolution check · metadata endpoint blocked",
    icon: Wifi,
  },
];

const STATUS_CONFIG = {
  covered:   { label: "Covered",   bg: "bg-emerald-50",  border: "border-emerald-200", text: "text-emerald-700",  dot: "bg-emerald-500"  },
  patched:   { label: "Patched",   bg: "bg-amber-50",    border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-500"    },
  monitored: { label: "Monitored", bg: "bg-blue-50",     border: "border-blue-200",    text: "text-blue-700",    dot: "bg-blue-500"     },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminSecurityPage() {
  const [threats, setThreats]       = useState<ThreatMessage[]>([]);
  const [chatUsers, setChatUsers]   = useState<ChatUser[]>([]);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab]   = useState<"owasp" | "threats" | "sessions">("owasp");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [msgsRes, usersRes] = await Promise.all([
        api.get("/api/admin/chat/messages?limit=200"),
        api.get("/api/admin/chat/users?days=30"),
      ]);

      const msgs: ThreatMessage[] = msgsRes.data.data ?? [];
      const users: ChatUser[]     = usersRes.data.data ?? [];

      const suspicious = msgs.filter(m => m.suspicious);
      setThreats(suspicious);
      setChatUsers(users);
      setStats({
        total:          msgs.length,
        suspicious:     suspicious.length,
        clean:          msgs.length - suspicious.length,
        rate:           msgs.length ? Math.round((suspicious.length / msgs.length) * 100) : 0,
        suspiciousUsers: users.filter(u => u.hasSuspicious).length,
        totalSessions:  users.length,
      });
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Security fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF7F2] p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-[#C4786A] flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-wide text-[#1A1410]">Security Dashboard</h1>
            <p className="text-xs text-[#6B4F3A]/60 mt-0.5">OWASP Top 10 · Threat Monitoring · Audit Trail</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6B4F3A]/50 flex items-center gap-1">
            <Clock size={11} /> {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-[#E0D5C8] rounded-sm hover:bg-[#F0EAE2] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Alert banner ── */}
      {stats && stats.suspicious > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-sm px-4 py-3">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <span className="text-sm text-red-800">
            <strong>{stats.suspicious}</strong> prompt injection attempt{stats.suspicious > 1 ? "s" : ""} detected in the last 200 messages.
            {" "}<span className="font-medium">Review the Threats tab immediately.</span>
          </span>
        </div>
      )}

      {/* ── Stats bar ── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Messages",     value: stats.total,          icon: MessageSquare, color: "text-[#6B4F3A]"  },
            { label: "Threats Detected",   value: stats.suspicious,     icon: AlertTriangle, color: "text-red-600"    },
            { label: "Clean Messages",     value: stats.clean,          icon: CheckCircle,   color: "text-emerald-600"},
            { label: "Threat Rate",        value: `${stats.rate}%`,     icon: TrendingUp,    color: stats.rate > 5 ? "text-red-600" : "text-emerald-600" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#E0D5C8] rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6B4F3A]/60 uppercase tracking-wider">{s.label}</span>
                <s.icon size={14} className={s.color} />
              </div>
              <p className={`text-2xl font-light ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex border-b border-[#E0D5C8]">
        {(["owasp", "threats", "sessions"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm capitalize tracking-wide transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-[#C4786A] text-[#C4786A]"
                : "border-transparent text-[#6B4F3A]/60 hover:text-[#6B4F3A]"
            }`}
          >
            {tab === "owasp" ? "OWASP Coverage" : tab === "threats" ? `Threat Feed${threats.length ? ` (${threats.length})` : ""}` : "Sessions"}
          </button>
        ))}
      </div>

      {/* ── Tab: OWASP Coverage ── */}
      {activeTab === "owasp" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {OWASP_ITEMS.map(item => {
            const cfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
            const Icon = item.icon;
            return (
              <div key={item.id} className={`bg-white border ${cfg.border} rounded-sm p-4 flex gap-4`}>
                <div className={`w-9 h-9 rounded-sm ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon size={16} className={cfg.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#6B4F3A]/50">{item.id}</span>
                      <span className="text-sm font-medium text-[#1A1410] truncate">{item.name}</span>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs shrink-0 ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B4F3A]/70 mb-1.5 leading-relaxed">{item.detail}</p>
                  <code className="text-xs bg-[#F0EAE2] text-[#6B4F3A] px-2 py-0.5 rounded-sm font-mono">
                    {item.file}
                  </code>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab: Threat Feed ── */}
      {activeTab === "threats" && (
        <div className="bg-white border border-[#E0D5C8] rounded-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-[#6B4F3A]/50 text-sm">Loading threats…</div>
          ) : threats.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
              <p className="text-sm text-[#6B4F3A]/60">No threats detected in last 200 messages</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#F0EAE2] text-[#6B4F3A] text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Suspicious Message</th>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider w-28">Type</th>
                </tr>
              </thead>
              <tbody>
                {threats.map((msg, i) => {
                  // Detect what kind of injection it is
                  const lower = msg.userMessage.toLowerCase();
                  const injType =
                    /ignore|disregard|forget|override|new instruction/i.test(msg.userMessage) ? "Override" :
                    /dan|jailbreak|developer mode/i.test(msg.userMessage) ? "Role Injection" :
                    /system prompt|repeat your|print your/i.test(msg.userMessage) ? "Extraction" :
                    /select|union|drop|from/i.test(lower) ? "SQL Pattern" :
                    /<script|javascript:|onerror/i.test(msg.userMessage) ? "XSS" :
                    "Suspicious";

                  return (
                    <tr key={msg.id} className={`border-t border-[#E0D5C8] bg-red-50/20 hover:bg-red-50/40 transition-colors`}>
                      <td className="px-4 py-3 text-xs text-[#6B4F3A]/60 whitespace-nowrap">
                        <div>{timeAgo(msg.createdAt)}</div>
                        <div className="text-[10px] opacity-60">{new Date(msg.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {msg.userId ? (
                          <span className="text-[#6B4F3A]">{msg.userId.slice(0, 8)}…</span>
                        ) : (
                          <span className="text-[#6B4F3A]/40">anon</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="text-[#1A1410] text-xs line-clamp-2 leading-relaxed" title={msg.userMessage}>
                          {msg.userMessage}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-sm">
                          <XCircle size={10} />
                          {injType}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Tab: Sessions ── */}
      {activeTab === "sessions" && (
        <div className="bg-white border border-[#E0D5C8] rounded-sm overflow-hidden">
          <div className="px-4 py-3 bg-[#F0EAE2] border-b border-[#E0D5C8] flex items-center justify-between">
            <span className="text-xs text-[#6B4F3A] uppercase tracking-wider font-medium">Chat Sessions — Last 30 Days</span>
            <div className="flex items-center gap-3 text-xs text-[#6B4F3A]/60">
              <span className="flex items-center gap-1"><Users size={11} /> {chatUsers.length} sessions</span>
              <span className="flex items-center gap-1 text-red-600"><AlertTriangle size={11} /> {chatUsers.filter(u => u.hasSuspicious).length} flagged</span>
            </div>
          </div>
          {loading ? (
            <div className="py-16 text-center text-[#6B4F3A]/50 text-sm">Loading sessions…</div>
          ) : chatUsers.length === 0 ? (
            <div className="py-16 text-center text-[#6B4F3A]/50 text-sm">No sessions found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-[#6B4F3A] text-left border-b border-[#E0D5C8]">
                <tr>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Session</th>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Messages</th>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Last Active</th>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {chatUsers.map(u => (
                  <tr key={u.sessionId} className={`border-t border-[#E0D5C8] ${u.hasSuspicious ? "bg-red-50/20" : "hover:bg-[#FAF7F2]"} transition-colors`}>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-[#1A1410]">{u.identifier}</div>
                      {u.userEmail && <div className="text-[10px] text-[#6B4F3A]/50">{u.userEmail}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#6B4F3A]/60">
                      {u.sessionId.slice(-10)}
                      {u.isAnon && <span className="ml-1 text-[10px] bg-[#F0EAE2] text-[#6B4F3A] px-1 rounded">anon</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#1A1410]">{u.messageCount}</td>
                    <td className="px-4 py-3 text-xs text-[#6B4F3A]/60">{timeAgo(u.lastActive)}</td>
                    <td className="px-4 py-3">
                      {u.hasSuspicious ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-sm">
                          <AlertTriangle size={10} /> Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-sm">
                          <CheckCircle size={10} /> Clean
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}