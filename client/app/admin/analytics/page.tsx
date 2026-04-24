"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar,
} from "recharts";
import {
  Users, ShoppingBag, DollarSign, UserCheck,
  ChevronRight, ChevronUp, ChevronDown,
  X, Eye, Search, Heart, MessageSquare, Zap, AlertTriangle, CheckCircle, HelpCircle, Bot, MousePointer,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ActivityPoint { date: string; views: number; searches: number; carts: number; wishlists: number; }
interface KPI { totalUsers: number; totalOrders: number; totalRevenue: number; activeUsers7d: number; }
interface UserSummary { id: string; name: string | null; email: string | null; views: number; searches: number; carts: number; wishlists: number; total: number; last_active: string | null; }
interface UserDetail { views: number; searches: number; carts: number; wishlists: number; recentSignals: { id: string; type: string; productId?: string; searchQuery?: string; weight: number; createdAt: string; }[]; }
interface QualitySummaryRow { intent: string; count: number; first_seen: string; last_seen: string; }
interface QualitySample { id: string; message: string; userId: string | null; createdAt: string; }
interface ChatQuality { summary: QualitySummaryRow[]; offTopicSample: QualitySample[]; noRagSample: QualitySample[]; }
interface SignalBreakdownRow { type: string; count: number; unique_users: number; }
interface SignalTrendRow { date: string; type: string; count: number; }
interface SignalsBreakdown { breakdown: SignalBreakdownRow[]; trend: SignalTrendRow[]; }
type SortKey = "total" | "views" | "searches" | "carts" | "wishlists";

// ── Design tokens ─────────────────────────────────────────────────────────────
const D = {
  bg: "#0A0A0F", panel: "#111118", panelB: "#16161f",
  border: "rgba(255,255,255,0.07)", text: "#fff",
  muted: "rgba(255,255,255,0.5)", dim: "rgba(255,255,255,0.22)",
  orange: "#FF5F1F", cyan: "#00FFFF", purple: "#9B59FF", green: "#00FFAA",
  yellow: "#FFD700", red: "#FF4444",
  font: "'Syncopate', sans-serif", mono: "monospace",
};
const PALETTE: Record<string, string> = {
  views: "#FF5F1F", searches: "#00FFFF", carts: "#9B59FF", wishlists: "#00FFAA", chat_rag: "#FFD700",
};
const PIE_COLORS = ["#FF5F1F", "#00FFFF", "#9B59FF", "#00FFAA", "#FFD700"];
const INTENT_COLORS: Record<string, string> = {
  skincare: "#00FFAA", no_rag_context: "#FFD700", off_topic: "#FF4444", unknown: "rgba(255,255,255,0.3)",
};
const CHART_TOOLTIP = {
  contentStyle: { background: "#16161f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, fontSize: 11, color: "#fff" },
  labelStyle: { color: "rgba(255,255,255,0.6)", fontWeight: 500 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) { return n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(1)}k` : String(n); }
function fmtCurrency(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n); }
function fmtDate(s: string | null) { if (!s) return "—"; return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function fmtDateTime(s: string) { return new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }

// ── Sub-components ────────────────────────────────────────────────────────────
function KPICard({ label, value, icon: Icon, sub, accent = false, loading = false }: { label: string; value: string; icon: React.ComponentType<any>; sub: string; accent?: boolean; loading?: boolean; }) {
  return (
    <div style={{ background: D.panel, border: `1px solid ${accent ? "rgba(255,95,31,0.3)" : D.border}`, borderRadius: 4, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.18em", color: D.dim }}>{label}</span>
        <span style={{ padding: "0.35rem", borderRadius: 3, background: accent ? "rgba(255,95,31,0.1)" : "rgba(255,255,255,0.04)" }}>
          <Icon size={14} color={accent ? D.orange : D.dim} />
        </span>
      </div>
      {loading ? <div style={{ height: 36, width: 90, background: D.border, borderRadius: 3 }} /> : (
        <p style={{ fontFamily: D.mono, fontSize: "1.85rem", fontWeight: 700, color: accent ? D.orange : D.text, lineHeight: 1 }}>{value}</p>
      )}
      <p style={{ fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.12em", color: D.dim }}>{sub}</p>
    </div>
  );
}

function SortBtn({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return null;
  return dir === "asc" ? <ChevronUp size={10} style={{ display: "inline", marginLeft: 3 }} /> : <ChevronDown size={10} style={{ display: "inline", marginLeft: 3 }} />;
}

function SignalIcon({ type }: { type: string }) {
  const map: Record<string, JSX.Element> = {
    view:     <Eye size={11} color={PALETTE.views} />,
    search:   <Search size={11} color={PALETTE.searches} />,
    cart:     <ShoppingBag size={11} color={PALETTE.carts} />,
    wishlist: <Heart size={11} color={PALETTE.wishlists} />,
    chat_rag: <Bot size={11} color={PALETTE.chat_rag} />,
  };
  return map[type] ?? <Zap size={11} color={D.dim} />;
}

// ── Rec Intelligence Tab ──────────────────────────────────────────────────────
function RecIntelligenceTab({ quality, signals, loadingQ, loadingS }: {
  quality: ChatQuality | null;
  signals: SignalsBreakdown | null;
  loadingQ: boolean;
  loadingS: boolean;
}) {
  const [sampleTab, setSampleTab] = useState<"off_topic" | "no_rag">("off_topic");

  // Intent pie data
  const intentPie = quality?.summary.map(r => ({
    name: r.intent.replace(/_/g, " "),
    value: r.count,
    color: INTENT_COLORS[r.intent] ?? D.dim,
  })) ?? [];

  const totalIntents = intentPie.reduce((s, r) => s + r.value, 0) || 1;
  const skincareCount    = quality?.summary.find(r => r.intent === "skincare")?.count ?? 0;
  const offTopicCount    = quality?.summary.find(r => r.intent === "off_topic")?.count ?? 0;
  const noRagCount       = quality?.summary.find(r => r.intent === "no_rag_context")?.count ?? 0;
  const healthScore      = totalIntents > 0 ? Math.round((skincareCount / totalIntents) * 100) : 0;

  // Signal source breakdown
  const chatRagRow    = signals?.breakdown.find(r => r.type === "chat_rag");
  const uiTotal       = signals?.breakdown.filter(r => r.type !== "chat_rag").reduce((s, r) => s + r.count, 0) ?? 0;
  const chatRagTotal  = chatRagRow?.count ?? 0;
  const grandTotal    = uiTotal + chatRagTotal || 1;
  const chatRagPct    = Math.round((chatRagTotal / grandTotal) * 100);
  const uiPct         = Math.round((uiTotal / grandTotal) * 100);

  // Signal trend — pivot to per-day totals by source
  const trendByDate: Record<string, { date: string; chatbot: number; ui: number }> = {};
  for (const row of signals?.trend ?? []) {
    if (!trendByDate[row.date]) trendByDate[row.date] = { date: row.date, chatbot: 0, ui: 0 };
    if (row.type === "chat_rag") trendByDate[row.date].chatbot += row.count;
    else trendByDate[row.date].ui += row.count;
  }
  const trendData = Object.values(trendByDate).sort((a, b) => a.date.localeCompare(b.date));

  const stat = (label: string, value: string | number, color: string, sub: string) => (
    <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 4, padding: "1rem" }}>
      <p style={{ fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.15em", color: D.dim, marginBottom: "0.5rem" }}>{label}</p>
      <p style={{ fontFamily: D.mono, fontSize: "1.6rem", fontWeight: 700, color, lineHeight: 1, marginBottom: "0.4rem" }}>{value}</p>
      <p style={{ fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.1em", color: D.dim }}>{sub}</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* ── Top KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem" }}>
        {stat("Chatbot Health Score", loadingQ ? "—" : `${healthScore}%`, healthScore >= 70 ? D.green : healthScore >= 40 ? D.yellow : D.red, "% of messages resolved with skincare context")}
        {stat("Off-Topic Messages", loadingQ ? "—" : fmt(offTopicCount), D.red, "Hallucination / out-of-scope replies")}
        {stat("No RAG Context", loadingQ ? "—" : fmt(noRagCount), D.yellow, "Skincare Q but zero product matches")}
        {stat("Chat→Rec Signals", loadingS ? "—" : fmt(chatRagTotal), D.yellow, `${chatRagPct}% of all recommendation signals`)}
      </div>

      {/* ── Bidirectional flow ── */}
      <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 4, padding: "1.5rem" }}>
        <p style={{ fontFamily: D.font, fontSize: "0.55rem", letterSpacing: "0.15em", color: D.text, marginBottom: 4 }}>Bidirectional Recommendation Flow</p>
        <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.dim, marginBottom: "1.5rem" }}>How chatbot conversations and UI interactions each feed the recommendation engine</p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
          {/* Chatbot node */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ background: "rgba(255,215,0,0.08)", border: `1px solid rgba(255,215,0,0.3)`, borderRadius: 8, padding: "1.25rem", marginBottom: "0.75rem" }}>
              <Bot size={28} color={D.yellow} style={{ marginBottom: "0.5rem" }} />
              <p style={{ fontFamily: D.font, fontSize: "0.48rem", letterSpacing: "0.15em", color: D.yellow }}>Chatbot</p>
              <p style={{ fontFamily: D.mono, fontSize: "1.2rem", fontWeight: 700, color: D.text, marginTop: "0.5rem" }}>{loadingS ? "—" : fmt(chatRagTotal)}</p>
              <p style={{ fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.1em", color: D.dim }}>chat_rag signals</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <p style={{ fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.1em", color: D.dim }}>User asks → RAG surfaces products</p>
              <p style={{ fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.1em", color: D.dim }}>→ signals written → recs updated</p>
            </div>
          </div>

          {/* Arrow both ways */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <div style={{ width: 40, height: 2, background: `linear-gradient(to right, ${D.yellow}, ${D.orange})` }} />
              <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `7px solid ${D.orange}` }} />
            </div>
            <div style={{ background: "rgba(255,95,31,0.1)", border: `1px solid rgba(255,95,31,0.3)`, borderRadius: 6, padding: "0.75rem 1rem", textAlign: "center" }}>
              <Zap size={18} color={D.orange} style={{ marginBottom: "0.35rem" }} />
              <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.orange }}>Rec Engine</p>
              <p style={{ fontFamily: D.mono, fontSize: "0.9rem", fontWeight: 700, color: D.text, marginTop: "0.35rem" }}>{loadingS ? "—" : fmt(grandTotal)}</p>
              <p style={{ fontFamily: D.font, fontSize: "0.36rem", letterSpacing: "0.1em", color: D.dim }}>total signals</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: `7px solid ${D.cyan}` }} />
              <div style={{ width: 40, height: 2, background: `linear-gradient(to right, ${D.cyan}, ${D.purple})` }} />
            </div>
          </div>

          {/* UI node */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ background: "rgba(0,255,255,0.05)", border: `1px solid rgba(0,255,255,0.2)`, borderRadius: 8, padding: "1.25rem", marginBottom: "0.75rem" }}>
              <MousePointer size={28} color={D.cyan} style={{ marginBottom: "0.5rem" }} />
              <p style={{ fontFamily: D.font, fontSize: "0.48rem", letterSpacing: "0.15em", color: D.cyan }}>UI Actions</p>
              <p style={{ fontFamily: D.mono, fontSize: "1.2rem", fontWeight: 700, color: D.text, marginTop: "0.5rem" }}>{loadingS ? "—" : fmt(uiTotal)}</p>
              <p style={{ fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.1em", color: D.dim }}>view / search / cart / wishlist</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <p style={{ fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.1em", color: D.dim }}>Browse, search, wishlist, cart</p>
              <p style={{ fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.1em", color: D.dim }}>→ signals written → recs updated</p>
            </div>
          </div>
        </div>

        {/* Source bars */}
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {[
            { label: "Chatbot (chat_rag)", pct: chatRagPct, count: chatRagTotal, color: D.yellow },
            { label: "UI Interactions", pct: uiPct, count: uiTotal, color: D.cyan },
          ].map(({ label, pct, count, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.12em", color: D.dim, width: 130 }}>{label}</span>
              <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.6s" }} />
              </div>
              <span style={{ fontFamily: D.mono, fontSize: "0.8rem", color: D.text, width: 40, textAlign: "right" }}>{fmt(count)}</span>
              <span style={{ fontFamily: D.mono, fontSize: "0.72rem", color: D.dim, width: 36, textAlign: "right" }}>{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

        {/* Intent pie */}
        <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 4, padding: "1.5rem" }}>
          <p style={{ fontFamily: D.font, fontSize: "0.55rem", letterSpacing: "0.15em", color: D.text, marginBottom: 4 }}>Chat Intent Distribution</p>
          <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.dim, marginBottom: "1rem" }}>What topics users actually ask the chatbot about</p>
          {loadingQ ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: D.font, fontSize: "0.42rem", color: D.dim }}>Loading…</span>
            </div>
          ) : intentPie.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: D.font, fontSize: "0.42rem", color: D.dim }}>No chat data yet</span>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={intentPie} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                    {intentPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
                {intentPie.map((d) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: d.color, boxShadow: `0 0 5px ${d.color}`, flexShrink: 0 }} />
                      <span style={{ fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.12em", color: D.muted, textTransform: "capitalize" }}>{d.name}</span>
                    </span>
                    <span style={{ fontFamily: D.mono, fontSize: "0.78rem", color: D.text }}>
                      {fmt(d.value)}{" "}
                      <span style={{ color: D.dim }}>{Math.round((d.value / totalIntents) * 100)}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Signal trend chatbot vs UI */}
        <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 4, padding: "1.5rem" }}>
          <p style={{ fontFamily: D.font, fontSize: "0.55rem", letterSpacing: "0.15em", color: D.text, marginBottom: 4 }}>Signal Sources — Daily Trend</p>
          <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.dim, marginBottom: "1rem" }}>Chatbot vs UI signals over time</p>
          {loadingS ? (
            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: D.font, fontSize: "0.42rem", color: D.dim }}>Loading…</span>
            </div>
          ) : trendData.length === 0 ? (
            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: D.font, fontSize: "0.42rem", color: D.dim }}>No signal data yet</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={D.yellow} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={D.yellow} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={D.cyan} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={D.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: D.dim }} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: D.dim }} />
                <Tooltip {...CHART_TOOLTIP} />
                <Legend wrapperStyle={{ fontSize: 11, color: D.dim }} />
                <Area type="monotone" dataKey="chatbot" stroke={D.yellow} strokeWidth={1.5} fill="url(#gc)" dot={false} name="Chatbot" />
                <Area type="monotone" dataKey="ui"      stroke={D.cyan}   strokeWidth={1.5} fill="url(#gu)" dot={false} name="UI" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── All signal types breakdown ── */}
      {signals && signals.breakdown.length > 0 && (
        <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 4, padding: "1.5rem" }}>
          <p style={{ fontFamily: D.font, fontSize: "0.55rem", letterSpacing: "0.15em", color: D.text, marginBottom: 4 }}>All Signal Types</p>
          <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.dim, marginBottom: "1.25rem" }}>Every signal type feeding the recommendation engine</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "0.65rem" }}>
            {signals.breakdown.map(row => {
              const color = PALETTE[row.type] ?? D.dim;
              const weight: Record<string, number> = { view: 1, search: 2, wishlist: 3, cart: 4, chat_rag: 2 };
              return (
                <div key={row.type} style={{ background: D.panelB, border: `1px solid ${D.border}`, borderRadius: 4, padding: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.65rem" }}>
                    <SignalIcon type={row.type} />
                    <span style={{ fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.12em", color, textTransform: "capitalize" }}>{row.type.replace("_", " ")}</span>
                  </div>
                  <p style={{ fontFamily: D.mono, fontSize: "1.4rem", fontWeight: 700, color: D.text, lineHeight: 1 }}>{fmt(row.count)}</p>
                  <p style={{ fontFamily: D.font, fontSize: "0.36rem", letterSpacing: "0.1em", color: D.dim, marginTop: "0.4rem" }}>{fmt(row.unique_users)} users · weight ×{weight[row.type] ?? 1}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Problem messages ── */}
      <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: D.font, fontSize: "0.55rem", letterSpacing: "0.15em", color: D.text }}>Problem Messages</p>
            <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.dim, marginTop: 4 }}>Recent messages that triggered quality flags</p>
          </div>
          <div style={{ display: "flex", gap: "0.35rem" }}>
            {([["off_topic", "Off-Topic", D.red], ["no_rag", "No RAG Match", D.yellow]] as const).map(([key, label, color]) => (
              <button
                key={key}
                onClick={() => setSampleTab(key)}
                style={{
                  background: sampleTab === key ? `${color}18` : "transparent",
                  border: `1px solid ${sampleTab === key ? color : D.border}`,
                  borderRadius: 3, padding: "0.4rem 0.85rem",
                  fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em",
                  color: sampleTab === key ? color : D.dim,
                  cursor: "pointer", transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: "0.4rem",
                }}
              >
                {key === "off_topic" ? <AlertTriangle size={10} /> : <HelpCircle size={10} />}
                {label} ({key === "off_topic" ? offTopicCount : noRagCount})
              </button>
            ))}
          </div>
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {loadingQ ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <span style={{ fontFamily: D.font, fontSize: "0.42rem", color: D.dim }}>Loading…</span>
            </div>
          ) : (sampleTab === "off_topic" ? quality?.offTopicSample : quality?.noRagSample)?.length === 0 ? (
            <div style={{ padding: "2.5rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle size={22} color={D.green} />
              <p style={{ fontFamily: D.font, fontSize: "0.45rem", letterSpacing: "0.15em", color: D.green }}>
                {sampleTab === "off_topic" ? "No off-topic messages" : "No unmatched skincare queries"}
              </p>
            </div>
          ) : (
            (sampleTab === "off_topic" ? quality?.offTopicSample : quality?.noRagSample)?.map(s => (
              <div key={s.id} style={{ padding: "0.85rem 1.5rem", borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  {sampleTab === "off_topic"
                    ? <AlertTriangle size={13} color={D.red} />
                    : <HelpCircle size={13} color={D.yellow} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: D.mono, fontSize: "0.82rem", color: D.text, marginBottom: "0.3rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.message}
                  </p>
                  <p style={{ fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.1em", color: D.dim }}>
                    {s.userId ? `User ${s.userId.slice(0, 8)}…` : "Anonymous"} · {fmtDateTime(String(s.createdAt))}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [tab, setTab]       = useState<"overview" | "users" | "rec_intel">("overview");

  const [activity, setActivity] = useState<ActivityPoint[]>([]);
  const [kpi, setKpi]           = useState<KPI | null>(null);
  const [users, setUsers]       = useState<UserSummary[]>([]);
  const [quality, setQuality]   = useState<ChatQuality | null>(null);
  const [signals, setSignals]   = useState<SignalsBreakdown | null>(null);

  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [userDetail, setUserDetail]     = useState<UserDetail | null>(null);
  const [search, setSearch]             = useState("");
  const [sort, setSort]                 = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "total", dir: "desc" });

  const [loadingKpi, setLoadingKpi]         = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingUsers, setLoadingUsers]       = useState(true);
  const [loadingDetail, setLoadingDetail]     = useState(false);
  const [loadingQ, setLoadingQ]               = useState(true);
  const [loadingS, setLoadingS]               = useState(true);
  const [searchFocused, setSearchFocused]     = useState(false);

  useEffect(() => {
    setLoadingActivity(true);
    const doFetch = () => api.get(`/api/admin/analytics/activity?period=${period}`).then(r => setActivity(r.data.data ?? [])).finally(() => setLoadingActivity(false));
    doFetch(); const iv = setInterval(doFetch, 15_000); return () => clearInterval(iv);
  }, [period]);

  useEffect(() => {
    const doFetch = () => api.get("/api/admin/analytics/overview").then(r => setKpi(r.data.data)).finally(() => setLoadingKpi(false));
    doFetch(); const iv = setInterval(doFetch, 30_000); return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const doFetch = () => api.get("/api/admin/analytics/users/summary").then(r => setUsers(r.data.data ?? [])).finally(() => setLoadingUsers(false));
    doFetch(); const iv = setInterval(doFetch, 30_000); return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    setLoadingQ(true);
    api.get(`/api/admin/chat/quality?days=${period === "day" ? 1 : period === "week" ? 7 : 30}`)
      .then(r => setQuality(r.data.data)).finally(() => setLoadingQ(false));
  }, [period]);

  useEffect(() => {
    setLoadingS(true);
    api.get(`/api/admin/analytics/signals/breakdown?days=${period === "day" ? 1 : period === "week" ? 7 : 30}`)
      .then(r => setSignals(r.data.data)).finally(() => setLoadingS(false));
  }, [period]);

  useEffect(() => {
    if (!selectedUser) { setUserDetail(null); return; }
    setLoadingDetail(true);
    api.get(`/api/admin/users/${selectedUser.id}/activity`).then(r => setUserDetail(r.data.data)).finally(() => setLoadingDetail(false));
  }, [selectedUser]);

  const pieData = activity.length
    ? (["views","searches","carts","wishlists"] as const).map(k => ({ name: k.charAt(0).toUpperCase()+k.slice(1), value: activity.reduce((s,d) => s+(d[k]??0), 0) }))
    : [];

  const filteredUsers = users
    .filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => { const diff = a[sort.key]-b[sort.key]; return sort.dir==="asc"?diff:-diff; });

  const maxByKey = (key: SortKey) => Math.max(...users.map(u => u[key])) || 1;
  const toggleSort = (key: SortKey) => setSort(s => s.key===key ? {key,dir:s.dir==="asc"?"desc":"asc"} : {key,dir:"desc"});

  const th: React.CSSProperties = { fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.15em", color: D.dim, padding: "0.85rem 1rem", fontWeight: 400, whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "0.85rem 1rem", borderBottom: `1px solid ${D.border}`, color: D.muted, fontSize: "0.8rem", verticalAlign: "middle" };

  return (
    <div style={{ minHeight: "100vh", background: D.bg, color: D.text }}>
      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#0d0d14", borderBottom: `1px solid ${D.border}`, padding: "1rem 0", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <p style={{ fontFamily: D.font, fontSize: "0.85rem", letterSpacing: "0.22em", fontWeight: 700, color: D.text }}>Analytics</p>
          <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.15em", color: D.dim, marginTop: 4 }}>Real-time ecommerce intelligence</p>
        </div>
        <div style={{ display: "flex", gap: "0.35rem" }}>
          {(["day","week","month"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ background: period===p?D.orange:"transparent", border: `1px solid ${period===p?D.orange:D.border}`, borderRadius: 3, padding: "0.45rem 0.9rem", fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.15em", textTransform: "uppercase", color: period===p?"#fff":D.dim, cursor: "pointer", transition: "all 0.15s" }}>{p}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1400 }}>
        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <KPICard label="Total Users"     value={kpi?fmt(kpi.totalUsers):"—"}          icon={Users}       sub="Registered accounts"          loading={loadingKpi} />
          <KPICard label="Active (7 days)" value={kpi?fmt(kpi.activeUsers7d):"—"}       icon={UserCheck}   sub="Users with recorded signals"   loading={loadingKpi} accent />
          <KPICard label="Total Orders"    value={kpi?fmt(kpi.totalOrders):"—"}         icon={ShoppingBag} sub="All-time orders placed"        loading={loadingKpi} />
          <KPICard label="Gross Revenue"   value={kpi?fmtCurrency(kpi.totalRevenue):"—"} icon={DollarSign}  sub="Sum of all orders"            loading={loadingKpi} />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${D.border}`, marginBottom: "1.5rem" }}>
          {[
            { key: "overview",  label: "Activity Overview" },
            { key: "users",     label: `User Breakdown${users.length?` (${users.length})`:""}` },
            { key: "rec_intel", label: "Rec. Intelligence", icon: <Bot size={12} style={{ marginRight: 4 }} /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              style={{ padding: "0.75rem 1.5rem", fontFamily: D.font, fontSize: "0.48rem", letterSpacing: "0.15em", background: "none", border: "none", cursor: "pointer", borderBottom: `2px solid ${tab===key?D.orange:"transparent"}`, marginBottom: -1, color: tab===key?D.text:D.dim, transition: "all 0.15s", display: "flex", alignItems: "center" }}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
              <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 4, padding: "1.5rem" }}>
                <p style={{ fontFamily: D.font, fontSize: "0.55rem", letterSpacing: "0.15em", color: D.text, marginBottom: 4 }}>Activity Trend</p>
                <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.dim, marginBottom: "1.25rem" }}>Engagement signals aggregated by date</p>
                {loadingActivity ? (
                  <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: D.font, fontSize: "0.42rem", color: D.dim }}>Loading…</span></div>
                ) : activity.length === 0 ? (
                  <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: D.font, fontSize: "0.42rem", color: D.dim }}>No data for this period</span></div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={activity}>
                      <defs>{Object.entries(PALETTE).slice(0,4).map(([k,c]) => <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={c} stopOpacity={0.25}/><stop offset="95%" stopColor={c} stopOpacity={0}/></linearGradient>)}</defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: D.dim }} />
                      <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: D.dim }} />
                      <Tooltip {...CHART_TOOLTIP} /><Legend wrapperStyle={{ fontSize: 11, color: D.dim }} />
                      {Object.entries(PALETTE).slice(0,4).map(([k,c]) => <Area key={k} type="monotone" dataKey={k} stroke={c} strokeWidth={1.5} fill={`url(#g-${k})`} dot={false} />)}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 4, padding: "1.5rem" }}>
                <p style={{ fontFamily: D.font, fontSize: "0.55rem", letterSpacing: "0.15em", color: D.text, marginBottom: 4 }}>Signal Mix</p>
                <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.dim, marginBottom: "1rem" }}>Total by type for period</p>
                {pieData.length === 0 ? (
                  <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: D.font, fontSize: "0.42rem", color: D.dim }}>No data</span></div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value">{pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i]} />)}</Pie><Tooltip {...CHART_TOOLTIP} /></PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.75rem" }}>
                      {pieData.map((d,i) => { const total=pieData.reduce((s,x)=>s+x.value,0)||1; return (
                        <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: PIE_COLORS[i], boxShadow: `0 0 5px ${PIE_COLORS[i]}`, flexShrink: 0 }} />
                            <span style={{ fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.12em", color: D.muted }}>{d.name}</span>
                          </span>
                          <span style={{ fontFamily: D.mono, fontSize: "0.78rem", color: D.text }}>{fmt(d.value)} <span style={{ color: D.dim }}>{Math.round((d.value/total)*100)}%</span></span>
                        </div>
                      ); })}
                    </div>
                  </>
                )}
              </div>
            </div>
            {activity.length > 0 && (
              <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 4, padding: "1.5rem" }}>
                <p style={{ fontFamily: D.font, fontSize: "0.55rem", letterSpacing: "0.15em", color: D.text, marginBottom: 4 }}>Daily Volume — Stacked</p>
                <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.dim, marginBottom: "1.25rem" }}>All signal types stacked per day</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={activity} barSize={activity.length>14?12:20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: D.dim }} />
                    <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: D.dim }} />
                    <Tooltip {...CHART_TOOLTIP} /><Legend wrapperStyle={{ fontSize: 11, color: D.dim }} />
                    {Object.entries(PALETTE).slice(0,4).map(([k,c]) => <Bar key={k} dataKey={k} stackId="a" fill={c} radius={k==="wishlists"?[3,3,0,0]:undefined} />)}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: D.panel, border: `1px solid ${searchFocused?"rgba(255,95,31,0.4)":D.border}`, borderRadius: 4, padding: "0.6rem 0.9rem", width: 280 }}>
                <Search size={12} color={D.dim} />
                <input type="text" placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)} onFocus={()=>setSearchFocused(true)} onBlur={()=>setSearchFocused(false)}
                  style={{ background: "none", border: "none", outline: "none", fontFamily: D.font, fontSize: "0.45rem", letterSpacing: "0.1em", color: D.text, width: "100%" }} />
              </div>
              <span style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.15em", color: D.dim }}>{filteredUsers.length} users</span>
            </div>
            <div style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 4, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${D.border}` }}>
                    <th style={{ ...th, textAlign: "left" }}>User</th>
                    {(["views","searches","carts","wishlists","total"] as SortKey[]).map(k => (
                      <th key={k} onClick={()=>toggleSort(k)} style={{ ...th, textAlign: "right", cursor: "pointer", userSelect: "none" }}>
                        {k} <SortBtn active={sort.key===k} dir={sort.dir} />
                      </th>
                    ))}
                    <th style={{ ...th, textAlign: "right" }}>Last Active</th>
                    <th style={{ width: 28 }} />
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? Array.from({length:6}).map((_,i) => (
                    <tr key={i}><td style={{ padding: "1rem" }}><div style={{ height: 10, width: 120, background: D.border, borderRadius: 2, marginBottom: 6 }}/><div style={{ height: 8, width: 180, background: D.border, borderRadius: 2 }}/></td>{Array.from({length:7}).map((_,j)=><td key={j} style={{ padding:"1rem",textAlign:"right" }}><div style={{ height:10,width:32,background:D.border,borderRadius:2,marginLeft:"auto" }}/></td>)}<td/><td/></tr>
                  )) : filteredUsers.length===0 ? (
                    <tr><td colSpan={9} style={{ textAlign:"center",padding:"3rem",color:D.dim }}><span style={{ fontFamily:D.font,fontSize:"0.45rem",letterSpacing:"0.18em" }}>No users found</span></td></tr>
                  ) : filteredUsers.map(u => <AnalyticsUserRow key={u.id} u={u} maxByKey={maxByKey} onSelect={()=>setSelectedUser(u)} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REC INTELLIGENCE TAB */}
        {tab === "rec_intel" && (
          <RecIntelligenceTab quality={quality} signals={signals} loadingQ={loadingQ} loadingS={loadingS} />
        )}
      </div>

      {/* User detail slide-over */}
      {selectedUser && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} onClick={() => setSelectedUser(null)} />
          <div style={{ width: 480, background: D.panelB, borderLeft: `1px solid ${D.border}`, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", background: D.panel }}>
              <div>
                <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.18em", color: D.dim, marginBottom: 6 }}>User Activity</p>
                <p style={{ fontFamily: D.font, fontSize: "0.7rem", letterSpacing: "0.15em", color: D.text, marginBottom: 4 }}>{selectedUser.name ?? "Unnamed User"}</p>
                <p style={{ fontFamily: D.mono, fontSize: "0.75rem", color: D.muted }}>{selectedUser.email}</p>
              </div>
              <button onClick={()=>setSelectedUser(null)} style={{ background:"none",border:"none",cursor:"pointer",color:D.dim,transition:"color 0.15s" }} onMouseEnter={e=>(e.currentTarget.style.color=D.text)} onMouseLeave={e=>(e.currentTarget.style.color=D.dim)}><X size={18}/></button>
            </div>
            {loadingDetail ? (
              <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center" }}><span style={{ fontFamily:D.font,fontSize:"0.42rem",letterSpacing:"0.15em",color:D.dim }}>Loading…</span></div>
            ) : userDetail ? (
              <div style={{ flex:1,overflowY:"auto",padding:"1.5rem",display:"flex",flexDirection:"column",gap:"1.5rem" }}>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.65rem" }}>
                  {([{k:"views",label:"Product Views"},{k:"searches",label:"Searches"},{k:"carts",label:"Cart Adds"},{k:"wishlists",label:"Wishlisted"}] as const).map(({k,label})=>(
                    <div key={k} style={{ background:D.panel,border:`1px solid ${D.border}`,borderRadius:4,padding:"1rem" }}>
                      <p style={{ fontFamily:D.font,fontSize:"0.4rem",letterSpacing:"0.15em",color:D.dim,marginBottom:"0.6rem" }}>{label}</p>
                      <p style={{ fontFamily:D.mono,fontSize:"1.6rem",fontWeight:700,color:PALETTE[k],lineHeight:1 }}>{userDetail[k]}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ fontFamily:D.font,fontSize:"0.42rem",letterSpacing:"0.18em",color:D.dim,marginBottom:"0.85rem" }}>Engagement Breakdown</p>
                  <div style={{ display:"flex",flexDirection:"column",gap:"0.65rem" }}>
                    {(["views","searches","carts","wishlists"] as const).map(k=>{
                      const total=(userDetail.views+userDetail.searches+userDetail.carts+userDetail.wishlists)||1;
                      const pct=Math.round((userDetail[k]/total)*100);
                      return (
                        <div key={k} style={{ display:"flex",alignItems:"center",gap:"0.75rem" }}>
                          <span style={{ fontFamily:D.font,fontSize:"0.4rem",letterSpacing:"0.12em",color:D.dim,width:64,textTransform:"capitalize" }}>{k}</span>
                          <div style={{ flex:1,height:4,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden" }}>
                            <div style={{ height:"100%",width:`${pct}%`,background:PALETTE[k],borderRadius:2 }} />
                          </div>
                          <span style={{ fontFamily:D.mono,fontSize:"0.75rem",color:D.text,width:36,textAlign:"right" }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p style={{ fontFamily:D.font,fontSize:"0.42rem",letterSpacing:"0.18em",color:D.dim,marginBottom:"0.85rem" }}>Recent Signals</p>
                  {userDetail.recentSignals.length===0 ? (
                    <p style={{ textAlign:"center",padding:"2rem",fontFamily:D.font,fontSize:"0.42rem",letterSpacing:"0.15em",color:D.dim }}>No recorded signals</p>
                  ) : (
                    <div style={{ display:"flex",flexDirection:"column",gap:"0.35rem" }}>
                      {userDetail.recentSignals.slice(0,40).map(s=>(
                        <div key={s.id} style={{ display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.6rem 0.85rem",background:D.panel,border:`1px solid ${D.border}`,borderRadius:3 }}>
                          <SignalIcon type={s.type} />
                          <span style={{ fontFamily:D.font,fontSize:"0.4rem",letterSpacing:"0.12em",textTransform:"capitalize",color:PALETTE[s.type]??D.muted,width:64,flexShrink:0 }}>{s.type}</span>
                          <span style={{ flex:1,fontFamily:D.mono,fontSize:"0.72rem",color:D.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.searchQuery||s.productId||<span style={{ color:D.dim }}>—</span>}</span>
                          <span style={{ fontFamily:D.mono,fontSize:"0.68rem",color:D.dim,flexShrink:0 }}>{fmtDateTime(s.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsUserRow({ u, maxByKey, onSelect }: { u: UserSummary; maxByKey: (k: SortKey) => number; onSelect: () => void; }) {
  const [h, setH] = useState(false);
  const td: React.CSSProperties = { padding: "0.85rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", verticalAlign: "middle" };
  return (
    <tr onClick={onSelect} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{ background:h?"rgba(255,255,255,0.025)":"transparent",cursor:"pointer",transition:"background 0.15s" }}>
      <td style={{ ...td, paddingLeft: "1.25rem" }}>
        <p style={{ color:"#fff",fontWeight:600,fontSize:"0.82rem",marginBottom:3 }}>{u.name??<span style={{ color:"rgba(255,255,255,0.2)",fontStyle:"italic" }}>No name</span>}</p>
        <p style={{ fontFamily:"monospace",fontSize:"0.72rem",color:"rgba(255,255,255,0.3)" }}>{u.email}</p>
      </td>
      {(["views","searches","carts","wishlists"] as const).map(k=>{
        const pct=Math.round((u[k]/maxByKey(k))*100);
        return (
          <td key={k} style={{ ...td, textAlign:"right" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"flex-end",gap:"0.5rem" }}>
              <div style={{ width:48,height:3,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden" }}><div style={{ height:"100%",width:`${pct}%`,background:PALETTE[k],borderRadius:2 }}/></div>
              <span style={{ fontFamily:"monospace",color:"#fff",minWidth:20,textAlign:"right" }}>{u[k]}</span>
            </div>
          </td>
        );
      })}
      <td style={{ ...td,textAlign:"right",color:"#fff",fontWeight:600,fontFamily:"monospace" }}>{u.total}</td>
      <td style={{ ...td,textAlign:"right",fontFamily:"monospace",fontSize:"0.72rem",color:"rgba(255,255,255,0.3)" }}>{u.last_active?new Date(u.last_active).toLocaleDateString("en-US",{month:"short",day:"numeric"}):"—"}</td>
      <td style={{ ...td,paddingRight:"0.75rem",color:h?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.15)" }}><ChevronRight size={14}/></td>
    </tr>
  );
}
