"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/lib/api";
import {
  Activity, ThumbsDown, ThumbsUp, MessageSquare, AlertTriangle,
  Users, RefreshCw, Search, ShieldAlert, ChevronRight, Clock, Database,
} from "lucide-react";

interface HourlyBucket { hour: string; count: number; }

interface ChatHealthMetrics {
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
}

interface ChatUser {
  userId: string | null;
  sessionId: string;
  messageCount: number;
  lastActive: string;
  hasSuspicious: boolean;
  identifier: string;
  isAnon: boolean;
}

interface BotMessage {
  text: string;
  confidence?: number;
}

interface ConvLog {
  id: string;
  sessionId: string;
  userId: string | null;
  userMessage: string;
  botMessages: BotMessage[];
  intent: string | null;
  createdAt: string;
  suspicious: boolean;
}

const D = {
  bg:     "#0A0A0F",
  panel:  "#111118",
  panelB: "#16161f",
  border: "rgba(255,255,255,0.07)",
  text:   "#fff",
  muted:  "rgba(255,255,255,0.5)",
  dim:    "rgba(255,255,255,0.22)",
  orange: "#FF5F1F",
  cyan:   "#00FFFF",
  green:  "#00FFAA",
  red:    "rgba(255,80,80,0.85)",
  redBg:  "rgba(255,80,80,0.08)",
  font:   "'Syncopate', sans-serif",
  mono:   "monospace",
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return `Today ${fmtTime(iso)}`;
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${fmtTime(iso)}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + fmtTime(iso);
}
function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}
function confColor(c: number | undefined): { bg: string; color: string } {
  if (c == null) return { bg: "rgba(255,255,255,0.06)", color: D.dim };
  if (c >= 0.8)  return { bg: "rgba(0,255,170,0.1)", color: D.green };
  if (c >= 0.6)  return { bg: "rgba(255,215,0,0.1)", color: "#FFD700" };
  return { bg: D.redBg, color: D.red };
}

function MetricCard({ label, value, icon: Icon, sub, warn }: {
  label: string; value: string | number; icon: any; sub?: string; warn?: boolean;
}) {
  return (
    <div style={{
      background: D.panel,
      border: `1px solid ${warn ? "rgba(255,80,80,0.25)" : D.border}`,
      borderRadius: 4,
      padding: "1rem 1.1rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
        <span style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.18em", color: D.dim }}>
          {label}
        </span>
        <Icon size={13} color={warn ? D.red : D.orange} />
      </div>
      <div style={{ fontFamily: D.mono, fontSize: "1.4rem", fontWeight: 700, color: warn ? D.red : D.text, lineHeight: 1, marginBottom: "0.35rem" }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.12em", color: D.dim }}>{sub}</div>}
    </div>
  );
}

function HourlyBar({ data }: { data: HourlyBucket[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{
      background: D.panel,
      border: `1px solid ${D.border}`,
      borderRadius: 4,
      padding: "1rem 1.25rem",
    }}>
      <p style={{ fontFamily: D.font, fontSize: "0.45rem", letterSpacing: "0.18em", color: D.muted, marginBottom: "0.85rem" }}>
        Messages / hour (24h)
      </p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 56 }}>
        {data.map(d => (
          <div
            key={d.hour}
            title={`${d.count} · ${new Date(d.hour).getHours()}:00`}
            style={{
              flex: 1,
              height: `${(d.count / max) * 100}%`,
              minHeight: d.count ? 3 : 1,
              background: `rgba(255,95,31,${0.2 + (d.count / max) * 0.6})`,
              borderRadius: "2px 2px 0 0",
              transition: "opacity 0.15s",
              cursor: "default",
            }}
          />
        ))}
      </div>
    </div>
  );
}

type UserFilter = "all" | "suspicious" | "auth" | "anon";

export default function AdminChatPage() {
  const [health, setHealth]             = useState<ChatHealthMetrics | null>(null);
  const [users, setUsers]               = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [conversation, setConversation] = useState<ConvLog[]>([]);
  const [search, setSearch]             = useState("");
  const [userFilter, setUserFilter]     = useState<UserFilter>("all");
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [healthLoading, setHealthLoading]   = useState(true);
  const [usersLoading, setUsersLoading]     = useState(true);
  const [convLoading, setConvLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [reindexing, setReindexing]     = useState(false);
  const [reindexMsg, setReindexMsg]     = useState<string | null>(null);
  const convBottomRef                   = useRef<HTMLDivElement>(null);

  const fetchHealth = useCallback(() => {
    api.get("/api/admin/chat/health")
      .then(r => { setHealth(r.data.data); setError(null); })
      .catch(e => setError(e.message))
      .finally(() => setHealthLoading(false));
  }, []);

  const fetchUsers = useCallback(() => {
    setUsersLoading(true);
    api.get("/api/admin/chat/users", { params: { days: 30 } })
      .then(r => setUsers(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, []);

  const handleReindex = useCallback(async () => {
    setReindexing(true);
    setReindexMsg(null);
    try {
      const r = await api.post("/api/admin/rag/reindex");
      const synced = r.data?.data?.synced ?? "?";
      setReindexMsg(`✅ Reindexed — ${synced} products synced`);
    } catch {
      setReindexMsg("❌ Reindex failed — is the RAG service running?");
    } finally {
      setReindexing(false);
      setTimeout(() => setReindexMsg(null), 5000);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchUsers();
    const iv = setInterval(fetchHealth, 10_000);
    return () => clearInterval(iv);
  }, [fetchHealth, fetchUsers]);

  useEffect(() => {
    if (!selectedUser) return;
    setConvLoading(true);
    setConversation([]);
    const params: Record<string, string | number> = { limit: 200 };
    if (selectedUser.userId) params.userId = selectedUser.userId;
    else params.sessionId = selectedUser.sessionId;
    api.get("/api/admin/chat/messages", { params })
      .then(r => { const logs: ConvLog[] = (r.data.data ?? []).reverse(); setConversation(logs); })
      .catch(() => {})
      .finally(() => setConvLoading(false));
  }, [selectedUser]);

  useEffect(() => {
    convBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const filteredUsers = users.filter(u => {
    const matchSearch = u.identifier.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      userFilter === "all"        ? true :
      userFilter === "suspicious" ? u.hasSuspicious :
      userFilter === "auth"       ? !u.isAnon :
      u.isAnon;
    return matchSearch && matchFilter;
  });

  const displayedConv = suspiciousOnly ? conversation.filter(l => l.suspicious) : conversation;
  const suspiciousCount = users.filter(u => u.hasSuspicious).length;

  if (healthLoading && !health) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: D.dim, gap: "0.75rem" }}>
        <RefreshCw size={16} className="animate-spin" />
        <span style={{ fontFamily: D.font, fontSize: "0.5rem", letterSpacing: "0.3em" }}>Loading…</span>
      </div>
    );
  }
  if (error && !health) {
    return <div style={{ padding: "2rem", color: D.red, fontFamily: D.font, fontSize: "0.55rem" }}>Error: {error}</div>;
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: D.bg, overflow: "hidden" }}>

      {/* Header */}
      <div style={{
        padding: "1.25rem 0 1rem",
        borderBottom: `1px solid ${D.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontFamily: D.font, fontSize: "0.85rem", letterSpacing: "0.22em", fontWeight: 700, color: D.text }}>
            Chatbot Monitor
          </p>
          <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.15em", color: D.dim, marginTop: 4 }}>
            Live · last 24 hours · auto-refresh 10s
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {reindexMsg && (
            <span style={{ fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.1em", color: reindexMsg.startsWith("✅") ? D.green : D.red }}>
              {reindexMsg}
            </span>
          )}
          <button
            onClick={handleReindex}
            disabled={reindexing}
            title="Wipe ChromaDB and re-embed all products from the database"
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "none",
              border: `1px solid ${D.border}`,
              borderRadius: 3,
              padding: "0.5rem 0.9rem",
              fontFamily: D.font,
              fontSize: "0.42rem",
              letterSpacing: "0.15em",
              color: D.dim,
              cursor: reindexing ? "not-allowed" : "pointer",
              opacity: reindexing ? 0.5 : 1,
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => { if (!reindexing) { e.currentTarget.style.color = D.text; e.currentTarget.style.borderColor = D.orange; } }}
            onMouseLeave={e => { e.currentTarget.style.color = D.dim; e.currentTarget.style.borderColor = D.border; }}
          >
            <Database size={11} className={reindexing ? "animate-pulse" : ""} /> {reindexing ? "Reindexing…" : "Reindex RAG"}
          </button>
          <button
            onClick={() => { fetchHealth(); fetchUsers(); }}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "none",
              border: `1px solid ${D.border}`,
              borderRadius: 3,
              padding: "0.5rem 0.9rem",
              fontFamily: D.font,
              fontSize: "0.42rem",
              letterSpacing: "0.15em",
              color: D.dim,
              cursor: "pointer",
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = D.text; e.currentTarget.style.borderColor = D.orange; }}
            onMouseLeave={e => { e.currentTarget.style.color = D.dim; e.currentTarget.style.borderColor = D.border; }}
          >
            <RefreshCw size={11} /> Refresh
          </button>
        </div>
      </div>

      {/* Metrics row */}
      {health && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(6,1fr)",
          gap: "0.65rem", padding: "1rem 0",
          flexShrink: 0,
        }}>
          <MetricCard label="Conversations"    value={health.totalConversations} icon={MessageSquare} sub="past 24h" />
          <MetricCard label="Unique chatters"  value={health.uniqueUsers}        icon={Users}         sub={`${health.anonSessions} anon`} />
          <MetricCard label="Avg confidence"   value={`${(health.avgConfidence * 100).toFixed(1)}%`} icon={Activity} sub={`${health.avgMessagesPerUser.toFixed(1)} msg/user`} />
          <MetricCard label="Hallucination est." value={`${health.hallucinationRate.toFixed(1)}%`}   icon={AlertTriangle} warn={health.hallucinationRate > 10} />
          <MetricCard label="Negative feedback" value={`${health.negativeFeedbackRate.toFixed(1)}%`} icon={ThumbsDown}    warn={health.negativeFeedbackRate > 20} sub={`${health.totalFeedbacks} total`} />
          <MetricCard label="Positive feedback" value={`${health.positiveFeedbackRate.toFixed(1)}%`} icon={ThumbsUp} />
        </div>
      )}

      {/* Hourly bar */}
      {health?.hourlyActivity?.length ? (
        <div style={{ paddingBottom: "0.75rem", flexShrink: 0 }}>
          <HourlyBar data={health.hourlyActivity} />
        </div>
      ) : null}

      {/* Two-panel body */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, gap: "0.75rem", paddingBottom: "1rem" }}>

        {/* Left: user list */}
        <div style={{
          width: 260, flexShrink: 0,
          background: D.panel,
          border: `1px solid ${D.border}`,
          borderRadius: 4,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Search + filter */}
          <div style={{ padding: "0.65rem", borderBottom: `1px solid ${D.border}` }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${D.border}`,
              borderRadius: 3, padding: "0.45rem 0.65rem",
              marginBottom: "0.5rem",
            }}>
              <Search size={11} color={D.dim} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search user / session…"
                style={{
                  background: "none", border: "none", outline: "none",
                  fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.1em",
                  color: D.text, width: "100%",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {(["all", "auth", "anon", "suspicious"] as UserFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setUserFilter(f)}
                  style={{
                    flex: 1,
                    background: userFilter === f ? D.orange : "transparent",
                    border: `1px solid ${userFilter === f ? D.orange : D.border}`,
                    borderRadius: 2,
                    padding: "0.3rem 0",
                    fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.1em",
                    color: userFilter === f ? "#fff" : D.dim,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {f === "suspicious" ? `⚠ ${suspiciousCount}` : f}
                </button>
              ))}
            </div>
          </div>

          {/* User list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {usersLoading ? (
              <p style={{ padding: "1rem", fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.dim, textAlign: "center" }}>
                Loading users…
              </p>
            ) : filteredUsers.length === 0 ? (
              <p style={{ padding: "1rem", fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.dim, textAlign: "center" }}>
                No users found
              </p>
            ) : (
              filteredUsers.map(u => (
                <UserCard
                  key={`${u.userId ?? ""}:${u.sessionId}`}
                  user={u}
                  selected={selectedUser?.sessionId === u.sessionId}
                  onClick={() => setSelectedUser(u)}
                />
              ))
            )}
          </div>

          <div style={{
            padding: "0.5rem 0.85rem",
            borderTop: `1px solid ${D.border}`,
            fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.12em", color: D.dim,
          }}>
            {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* Right: conversation */}
        <div style={{
          flex: 1,
          background: D.panel,
          border: `1px solid ${D.border}`,
          borderRadius: 4,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {!selectedUser ? (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "0.75rem", color: D.dim,
            }}>
              <MessageSquare size={28} strokeWidth={1} />
              <p style={{ fontFamily: D.font, fontSize: "0.45rem", letterSpacing: "0.18em" }}>
                Select a user to inspect their conversation
              </p>
            </div>
          ) : (
            <>
              {/* Conv header */}
              <div style={{
                padding: "0.85rem 1.25rem",
                borderBottom: `1px solid ${D.border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexShrink: 0,
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: 4 }}>
                    {selectedUser.hasSuspicious && <ShieldAlert size={13} color={D.red} />}
                    <span style={{
                      fontFamily: selectedUser.isAnon ? D.mono : D.font,
                      fontSize: "0.58rem", letterSpacing: "0.1em",
                      color: selectedUser.isAnon ? D.muted : D.text,
                      fontStyle: selectedUser.isAnon ? "italic" : "normal",
                    }}>
                      {selectedUser.identifier}
                    </span>
                    {selectedUser.isAnon && (
                      <span style={{
                        fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.12em",
                        background: "rgba(255,255,255,0.06)",
                        border: `1px solid ${D.border}`,
                        borderRadius: 2, padding: "0.15rem 0.45rem", color: D.dim,
                      }}>anon</span>
                    )}
                  </div>
                  <p style={{ fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.12em", color: D.dim }}>
                    {selectedUser.messageCount} messages · last active {timeAgo(selectedUser.lastActive)}
                  </p>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={suspiciousOnly}
                    onChange={e => setSuspiciousOnly(e.target.checked)}
                    style={{ accentColor: D.red }}
                  />
                  <span style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.dim }}>
                    Suspicious only
                  </span>
                </label>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {convLoading ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 100, gap: "0.5rem", color: D.dim }}>
                    <RefreshCw size={14} className="animate-spin" />
                    <span style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em" }}>Loading…</span>
                  </div>
                ) : displayedConv.length === 0 ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 100, color: D.dim }}>
                    <span style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.15em" }}>
                      {suspiciousOnly ? "No suspicious messages found" : "No messages found"}
                    </span>
                  </div>
                ) : (
                  <>
                    {displayedConv.map(log => (
                      <ConversationBubble key={log.id} log={log} />
                    ))}
                    <div ref={convBottomRef} />
                  </>
                )}
              </div>

              {/* Conv footer */}
              {!convLoading && displayedConv.length > 0 && (
                <div style={{
                  padding: "0.5rem 1.25rem",
                  borderTop: `1px solid ${D.border}`,
                  display: "flex", gap: "1.5rem",
                  fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.12em", color: D.dim,
                  flexShrink: 0,
                }}>
                  <span>{displayedConv.length} turns shown</span>
                  <span>{displayedConv.filter(l => l.suspicious).length} suspicious</span>
                  {displayedConv[0] && <span>first: {fmtDate(displayedConv[0].createdAt)}</span>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UserCard({ user, selected, onClick }: { user: ChatUser; selected: boolean; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: "100%", textAlign: "left",
        padding: "0.75rem 0.85rem",
        borderBottom: `1px solid ${D.border}`,
        background: selected ? "rgba(255,95,31,0.07)" : h ? "rgba(255,255,255,0.025)" : "transparent",
        borderLeft: `2px solid ${selected ? D.orange : "transparent"}`,
        transition: "all 0.15s",
        cursor: "pointer", border: "none",
        borderBottomColor: D.border,
        borderBottomWidth: 1,
        borderBottomStyle: "solid",
        borderLeftColor: selected ? D.orange : "transparent",
        borderLeftWidth: 2,
        borderLeftStyle: "solid",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
          {user.hasSuspicious && <ShieldAlert size={11} color={D.red} style={{ flexShrink: 0 }} />}
          <span style={{
            fontFamily: user.isAnon ? D.mono : D.font,
            fontSize: "0.48rem", letterSpacing: "0.08em",
            color: user.isAnon ? D.dim : D.text,
            fontStyle: user.isAnon ? "italic" : "normal",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {user.identifier}
          </span>
        </div>
        <ChevronRight size={11} color={selected ? D.orange : D.dim} style={{ flexShrink: 0 }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.1em", color: D.dim }}>
        <span>{user.messageCount} msgs</span>
        <span>·</span>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Clock size={9} />{timeAgo(user.lastActive)}
        </span>
        {user.hasSuspicious && (
          <span style={{ marginLeft: "auto", color: D.red }}>⚠ suspicious</span>
        )}
      </div>
    </button>
  );
}

function ConversationBubble({ log }: { log: ConvLog }) {
  const botMsg = log.botMessages?.[0];
  const conf   = botMsg?.confidence;
  const cc     = confColor(conf);

  return (
    <div style={{
      padding: "1rem 1.25rem",
      borderBottom: `1px solid ${D.border}`,
      background: log.suspicious ? D.redBg : "transparent",
    }}>
      {/* Timestamp + flags */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.6rem",
        marginBottom: "0.6rem",
        fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.12em", color: D.dim,
      }}>
        <span>{fmtDate(log.createdAt)}</span>
        {log.intent && (
          <span style={{
            background: "rgba(155,89,255,0.1)", border: "1px solid rgba(155,89,255,0.2)",
            borderRadius: 2, padding: "0.1rem 0.45rem", color: "#9B59FF",
          }}>{log.intent}</span>
        )}
        {log.suspicious && (
          <span style={{
            display: "flex", alignItems: "center", gap: 4,
            background: D.redBg, border: `1px solid rgba(255,80,80,0.2)`,
            borderRadius: 2, padding: "0.1rem 0.45rem", color: D.red,
          }}>
            <AlertTriangle size={9} /> injection pattern
          </span>
        )}
      </div>

      {/* User bubble */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.6rem" }}>
        <div style={{
          maxWidth: "75%",
          padding: "0.65rem 0.85rem",
          borderRadius: "12px 12px 2px 12px",
          fontSize: "0.82rem",
          lineHeight: 1.55,
          background: log.suspicious ? D.redBg : "rgba(255,95,31,0.12)",
          border: `1px solid ${log.suspicious ? "rgba(255,80,80,0.2)" : "rgba(255,95,31,0.2)"}`,
          color: log.suspicious ? D.red : D.text,
        }}>
          {log.userMessage}
        </div>
      </div>

      {/* Bot bubble */}
      {botMsg && (
        <div style={{ display: "flex", justifyContent: "flex-start", gap: "0.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxWidth: "75%" }}>
            <div style={{
              padding: "0.65rem 0.85rem",
              borderRadius: "12px 12px 12px 2px",
              fontSize: "0.82rem",
              lineHeight: 1.55,
              background: D.panelB,
              border: `1px solid ${D.border}`,
              color: D.muted,
            }}>
              {botMsg.text}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingLeft: 4 }}>
              {conf != null && (
                <span style={{
                  fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.12em",
                  padding: "0.15rem 0.5rem", borderRadius: 2,
                  background: cc.bg, color: cc.color,
                }}>
                  conf {(conf * 100).toFixed(0)}%
                </span>
              )}
              <span style={{ fontFamily: D.mono, fontSize: "0.65rem", color: D.dim }}>
                id: {log.id.slice(0, 8)}…
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}