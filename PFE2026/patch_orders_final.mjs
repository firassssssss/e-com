import { writeFileSync } from "fs";
const path = "C:/e com/frontend2/app/admin/orders/page.tsx";

const content = `"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Search, Package, ChevronDown, ChevronUp, X } from "lucide-react";

interface OrderItem { productId: string; quantity: number; price: number; name?: string; }
interface Order {
  id: string; userId: string; userName: string | null; userEmail: string | null;
  totalAmount: number; status: string; items: OrderItem[];
  shippingAddress: string; paymentMethod: string; trackingNumber: string | null;
  createdAt: string; updatedAt: string;
}

const D = {
  bg: "#0A0A0F", panel: "#111118", panelB: "#16161f",
  border: "rgba(255,255,255,0.07)", text: "#fff",
  muted: "rgba(255,255,255,0.5)", dim: "rgba(255,255,255,0.22)",
  orange: "#FF5F1F", cyan: "#00FFFF", green: "#00FFAA",
  yellow: "#FFD700", red: "#FF4444",
  font: "'Syncopate', sans-serif", mono: "monospace",
};

const STATUS_ORDER = ["PENDING", "CONFIRMED", "ON_THE_WAY", "DELIVERED"];

const PIPELINE = [
  { key: "CONFIRMED",  label: "Confirmed"  },
  { key: "ON_THE_WAY", label: "On the Way" },
  { key: "DELIVERED",  label: "Delivered"  },
];

const STATUS_COLOR: Record<string, string> = {
  PENDING:    D.dim,
  CONFIRMED:  D.orange,
  ON_THE_WAY: D.cyan,
  DELIVERED:  D.green,
  CANCELLED:  D.red,
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}
function fmtDate(s: string) {
  return new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusPipeline({ order, onUpdate }: { order: Order; onUpdate: (id: string, status: string) => void }) {
  const [loading, setLoading] = useState(false);
  const currentIdx = STATUS_ORDER.indexOf(order.status);

  async function handleClick(stepKey: string) {
    if (loading) return;
    const stepIdx = STATUS_ORDER.indexOf(stepKey);
    let newStatus: string;
    if (stepKey === order.status) {
      // uncheck: revert to previous
      const prev: Record<string, string> = {
        CONFIRMED:  "PENDING",
        ON_THE_WAY: "CONFIRMED",
        DELIVERED:  "ON_THE_WAY",
      };
      newStatus = prev[stepKey] ?? "PENDING";
    } else {
      // only allow next step forward
      if (stepIdx !== currentIdx + 1) return;
      newStatus = stepKey;
    }
    setLoading(true);
    try {
      await api.patch(\`/api/admin/orders/\${order.id}/status\`, { status: newStatus });
      onUpdate(order.id, newStatus);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {PIPELINE.map((step, i) => {
        const stepIdx  = STATUS_ORDER.indexOf(step.key);
        const checked  = currentIdx >= stepIdx;
        const active   = order.status === step.key;
        const isNext   = stepIdx === currentIdx + 1;
        const color    = checked ? (active ? D.orange : D.green) : isNext ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)";
        const isLast   = i === PIPELINE.length - 1;
        const clickable = active || isNext;

        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center" }}>
            <button
              onClick={() => handleClick(step.key)}
              disabled={loading || !clickable}
              title={active ? \`Uncheck ? revert\` : clickable ? \`Set to \${step.label}\` : "Complete previous step first"}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
                background: "none", border: "none",
                cursor: (loading || !clickable) ? "not-allowed" : "pointer",
                padding: "0.2rem 0.5rem",
                opacity: loading ? 0.5 : 1,
              }}
            >
              <div style={{
                width: 13, height: 13, borderRadius: "50%",
                background: checked ? color : "transparent",
                border: \`2px solid \${color}\`,
                boxShadow: active ? \`0 0 10px \${color}\` : "none",
                transform: active ? "scale(1.3)" : "scale(1)",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {checked && <div style={{ width: 5, height: 5, borderRadius: "50%", background: active ? "#fff" : "rgba(0,0,0,0.4)" }} />}
              </div>
              <span style={{
                fontFamily: D.font, fontSize: "0.34rem", letterSpacing: "0.1em",
                color, whiteSpace: "nowrap", fontWeight: active ? 700 : 400,
                transition: "color 0.2s",
              }}>
                {step.label}
              </span>
            </button>
            {!isLast && (
              <div style={{
                width: 28, height: 2, marginBottom: "1rem",
                background: currentIdx > stepIdx
                  ? \`linear-gradient(to right, \${D.green}, \${D.orange})\`
                  : "rgba(255,255,255,0.08)",
                transition: "background 0.3s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderDetail({ order }: { order: Order }) {
  return (
    <tr>
      <td colSpan={7} style={{ padding: "0 1.5rem 1.25rem", background: D.panelB }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", paddingTop: "0.75rem" }}>
          <div>
            <p style={{ fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.15em", color: D.dim, marginBottom: "0.6rem" }}>Items</p>
            {(order.items as OrderItem[]).map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: D.mono, fontSize: "0.75rem", color: D.muted, marginBottom: "0.3rem" }}>
                <span>{item.name ?? item.productId.slice(0, 12) + "…"} ×{item.quantity}</span>
                <span style={{ color: D.text }}>{fmt(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.15em", color: D.dim, marginBottom: "0.6rem" }}>Shipping</p>
            <p style={{ fontFamily: D.mono, fontSize: "0.75rem", color: D.muted, lineHeight: 1.5 }}>{order.shippingAddress}</p>
            {order.trackingNumber && <p style={{ fontFamily: D.mono, fontSize: "0.72rem", color: D.cyan, marginTop: "0.5rem" }}>Track: {order.trackingNumber}</p>}
          </div>
          <div>
            <p style={{ fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.15em", color: D.dim, marginBottom: "0.6rem" }}>Details</p>
            <p style={{ fontFamily: D.mono, fontSize: "0.72rem", color: D.dim, marginBottom: "0.3rem" }}>ID: <span style={{ color: D.muted }}>{order.id.slice(0, 16)}…</span></p>
            <p style={{ fontFamily: D.mono, fontSize: "0.72rem", color: D.dim, marginBottom: "0.3rem" }}>Payment: <span style={{ color: D.muted }}>{order.paymentMethod}</span></p>
            <p style={{ fontFamily: D.mono, fontSize: "0.72rem", color: D.dim }}>Updated: <span style={{ color: D.muted }}>{fmtDate(order.updatedAt)}</span></p>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [userSearch, setUserSearch]   = useState("");
  const [dateFrom, setDateFrom]       = useState("");
  const [dateTo, setDateTo]           = useState("");
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo)   params.dateTo   = dateTo;
      const r = await api.get("/api/admin/orders", { params });
      setOrders(r.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  function handleStatusUpdate(id: string, status: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }

  const filtered = orders.filter(o => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return o.userName?.toLowerCase().includes(q) || o.userEmail?.toLowerCase().includes(q) || o.userId.toLowerCase().includes(q);
  });

  const statusCounts = {
    PENDING:    orders.filter(o => o.status === "PENDING").length,
    CONFIRMED:  orders.filter(o => o.status === "CONFIRMED").length,
    ON_THE_WAY: orders.filter(o => o.status === "ON_THE_WAY").length,
    DELIVERED:  orders.filter(o => o.status === "DELIVERED").length,
    CANCELLED:  orders.filter(o => o.status === "CANCELLED").length,
  };

  const th: React.CSSProperties = {
    fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.15em",
    color: D.dim, padding: "0.85rem 1rem", fontWeight: 400,
    textAlign: "left" as const, whiteSpace: "nowrap" as const,
  };

  return (
    <div style={{ minHeight: "100vh", background: D.bg, color: D.text }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "#0d0d14", borderBottom: \`1px solid \${D.border}\`,
        padding: "1rem 0", marginBottom: "1.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ fontFamily: D.font, fontSize: "0.85rem", letterSpacing: "0.22em", fontWeight: 700, color: D.text }}>Orders</p>
          <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.15em", color: D.dim, marginTop: 4 }}>
            {loading ? "Loading…" : \`\${filtered.length} orders\`}
          </p>
        </div>
        <button onClick={fetchOrders} style={{ background: "none", border: \`1px solid \${D.border}\`, borderRadius: 3, padding: "0.45rem 0.9rem", fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.15em", color: D.dim, cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.65rem", marginBottom: "1.5rem", flexWrap: "wrap" as const }}>
        {Object.entries(statusCounts).map(([k, count]) => (
          <div key={k} style={{ background: D.panel, border: \`1px solid \${STATUS_COLOR[k]}33\`, borderRadius: 3, padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLOR[k] }} />
            <span style={{ fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.12em", color: D.dim }}>{k.replace(/_/g, " ")}</span>
            <span style={{ fontFamily: D.mono, fontSize: "0.85rem", color: D.text, fontWeight: 700 }}>{count}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" as const }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: D.panel, border: \`1px solid \${searchFocused ? "rgba(255,95,31,0.4)" : D.border}\`, borderRadius: 4, padding: "0.6rem 0.9rem", width: 260, transition: "border 0.15s" }}>
          <Search size={12} color={D.dim} />
          <input type="text" placeholder="Filter by name or email…" value={userSearch} onChange={e => setUserSearch(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            style={{ background: "none", border: "none", outline: "none", fontFamily: D.font, fontSize: "0.43rem", letterSpacing: "0.1em", color: D.text, width: "100%" }} />
          {userSearch && <button onClick={() => setUserSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: D.dim, padding: 0, lineHeight: 0 }}><X size={11} /></button>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.12em", color: D.dim }}>From</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ background: D.panel, border: \`1px solid \${D.border}\`, borderRadius: 4, padding: "0.55rem 0.75rem", fontFamily: D.mono, fontSize: "0.78rem", color: D.text, outline: "none", colorScheme: "dark" as any }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.12em", color: D.dim }}>To</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ background: D.panel, border: \`1px solid \${D.border}\`, borderRadius: 4, padding: "0.55rem 0.75rem", fontFamily: D.mono, fontSize: "0.78rem", color: D.text, outline: "none", colorScheme: "dark" as any }} />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }} style={{ background: "none", border: \`1px solid \${D.border}\`, borderRadius: 3, padding: "0.5rem 0.75rem", fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.12em", color: D.dim, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <X size={10} /> Clear dates
          </button>
        )}
      </div>

      <div style={{ background: D.panel, border: \`1px solid \${D.border}\`, borderRadius: 4, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" as const, minWidth: 900 }}>
          <thead>
            <tr style={{ borderBottom: \`1px solid \${D.border}\` }}>
              <th style={th}>Date</th>
              <th style={th}>Customer</th>
              <th style={th}>Items</th>
              <th style={{ ...th, textAlign: "right" as const }}>Total</th>
              <th style={th}>Pipeline</th>
              <th style={{ ...th, textAlign: "center" as const }}>Status</th>
              <th style={{ width: 32 }} />
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} style={{ padding: "1rem" }}>
                    <div style={{ height: 10, width: j === 1 ? 140 : 80, background: D.border, borderRadius: 2 }} />
                  </td>
                ))}
                <td />
              </tr>
            )) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "3.5rem", color: D.dim }}>
                  <Package size={28} color={D.dim} style={{ marginBottom: "0.75rem" }} />
                  <p style={{ fontFamily: D.font, fontSize: "0.45rem", letterSpacing: "0.18em" }}>No orders found</p>
                </td>
              </tr>
            ) : filtered.map(order => {
              const isOpen = expanded === order.id;
              const tdStyle: React.CSSProperties = {
                padding: "0.9rem 1rem",
                borderBottom: isOpen ? "none" : \`1px solid \${D.border}\`,
                verticalAlign: "middle",
              };
              return (
                <React.Fragment key={order.id}>
                  <tr style={{ background: isOpen ? D.panelB : "transparent", transition: "background 0.15s" }}>
                    <td style={tdStyle}>
                      <p style={{ fontFamily: D.mono, fontSize: "0.78rem", color: D.muted }}>{fmtDate(order.createdAt)}</p>
                    </td>
                    <td style={tdStyle}>
                      <p style={{ fontFamily: D.font, fontSize: "0.7rem", color: D.text, marginBottom: 3 }}>
                        {order.userName ?? <span style={{ color: D.dim, fontStyle: "italic" }}>No name</span>}
                      </p>
                      <p style={{ fontFamily: D.mono, fontSize: "0.68rem", color: D.dim }}>{order.userEmail}</p>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontFamily: D.mono, fontSize: "0.78rem", color: D.muted }}>
                        {(order.items as OrderItem[]).length} item{(order.items as OrderItem[]).length !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <span style={{ fontFamily: D.mono, fontSize: "0.88rem", fontWeight: 700, color: D.text }}>{fmt(order.totalAmount)}</span>
                    </td>
                    <td style={tdStyle}>
                      <StatusPipeline order={order} onUpdate={handleStatusUpdate} />
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span style={{
                        fontFamily: D.font, fontSize: "0.36rem", letterSpacing: "0.1em",
                        color: STATUS_COLOR[order.status] ?? D.dim,
                        background: \`\${STATUS_COLOR[order.status] ?? D.dim}18\`,
                        border: \`1px solid \${STATUS_COLOR[order.status] ?? D.dim}44\`,
                        borderRadius: 3, padding: "0.25rem 0.6rem", whiteSpace: "nowrap" as const,
                      }}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, paddingRight: "0.75rem", textAlign: "center" }}>
                      <button onClick={() => setExpanded(isOpen ? null : order.id)} style={{ background: "none", border: "none", cursor: "pointer", color: D.dim, lineHeight: 0 }}>
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </td>
                  </tr>
                  {isOpen && <OrderDetail order={order} />}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;

writeFileSync(path, content, "utf8");
console.log("done");
