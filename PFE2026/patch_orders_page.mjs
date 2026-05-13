import { readFileSync, writeFileSync } from "fs";
const path = "C:/e com/frontend2/app/admin/orders/page.tsx";
let src = readFileSync(path, "utf8");

// Fix 1: status counts wrong case
src = src.replace(
  `const statusCounts = {
    pending:    orders.filter(o => o.status === "pending").length,
    confirmed:  orders.filter(o => o.status === "confirmed").length,
    on_the_way: orders.filter(o => o.status === "on_the_way").length,
    delivered:  orders.filter(o => o.status === "delivered").length,
    cancelled:  orders.filter(o => o.status === "cancelled").length,
  };`,
  `const statusCounts = {
    PENDING:    orders.filter(o => o.status === "PENDING").length,
    CONFIRMED:  orders.filter(o => o.status === "CONFIRMED").length,
    ON_THE_WAY: orders.filter(o => o.status === "ON_THE_WAY").length,
    DELIVERED:  orders.filter(o => o.status === "DELIVERED").length,
    CANCELLED:  orders.filter(o => o.status === "CANCELLED").length,
  };`
);

// Fix 2: replace StatusPipeline component with toggleable version
const oldPipeline = `// -- Status pipeline component -------------------------------------------------
function StatusPipeline({ order, onUpdate }: { order: Order; onUpdate: (id: string, status: string) => void }) {
  const [loading, setLoading] = useState(false);
  const currentIdx = PIPELINE.findIndex(s => s.key === order.status);

  async function handleClick(key: string) {
    if (loading || key === order.status) return;
    setLoading(true);
    try {
      await api.patch(\`/api/admin/orders/\${order.id}/status\`, { status: key });
      onUpdate(order.id, key);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {PIPELINE.map((step, i) => {
        const done    = currentIdx >= i;
        const active  = currentIdx === i;
        const color   = done ? (active ? D.orange : D.green) : D.dim;
        const isLast  = i === PIPELINE.length - 1;

        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center" }}>
            {/* Node */}
            <button
              onClick={() => handleClick(step.key)}
              title={\`Set to "\${step.label}"\`}
              disabled={loading}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
                background: "none", border: "none", cursor: loading ? "not-allowed" : "pointer",
                padding: "0.2rem 0.4rem",
              }}
            >
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: done ? color : "transparent",
                border: \`2px solid \${color}\`,
                boxShadow: active ? \`0 0 8px \${color}\` : "none",
                transition: "all 0.2s",
              }} />
              <span style={{
                fontFamily: D.font, fontSize: "0.36rem",
                letterSpacing: "0.1em", color,
                whiteSpace: "nowrap",
              }}>
                {step.label}
              </span>
            </button>

            {/* Connector line */}
            {!isLast && (
              <div style={{
                width: 32, height: 2,
                background: currentIdx > i
                  ? \`linear-gradient(to right, \${D.green}, \${D.orange})\`
                  : "rgba(255,255,255,0.1)",
                transition: "background 0.3s",
                marginBottom: "1rem",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}`;

const newPipeline = `// -- Status pipeline component -------------------------------------------------
const PIPELINE_PREV: Record<string, string> = {
  CONFIRMED:  "PENDING",
  ON_THE_WAY: "CONFIRMED",
  DELIVERED:  "ON_THE_WAY",
};

function StatusPipeline({ order, onUpdate }: { order: Order; onUpdate: (id: string, status: string) => void }) {
  const [loading, setLoading] = useState(false);
  const currentIdx = PIPELINE.findIndex(s => s.key === order.status);

  async function handleClick(key: string) {
    if (loading) return;
    // clicking active step unchecks it (go to previous), clicking other sets it
    const newStatus = key === order.status
      ? (PIPELINE_PREV[key] ?? "PENDING")
      : key;
    setLoading(true);
    try {
      await api.patch(\`/api/admin/orders/\${order.id}/status\`, { status: newStatus });
      onUpdate(order.id, newStatus);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {PIPELINE.map((step, i) => {
        const done    = currentIdx >= i;
        const active  = currentIdx === i;
        const color   = done ? (active ? D.orange : D.green) : D.dim;
        const isLast  = i === PIPELINE.length - 1;

        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center" }}>
            <button
              onClick={() => handleClick(step.key)}
              title={active ? \`Uncheck (revert to \${PIPELINE_PREV[step.key] ?? "PENDING"})\` : \`Set to "\${step.label}"\`}
              disabled={loading}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
                background: "none", border: "none", cursor: loading ? "not-allowed" : "pointer",
                padding: "0.2rem 0.4rem",
              }}
            >
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: done ? color : "transparent",
                border: \`2px solid \${color}\`,
                boxShadow: active ? \`0 0 8px \${color}\` : "none",
                transition: "all 0.2s",
                transform: active ? "scale(1.25)" : "scale(1)",
              }} />
              <span style={{
                fontFamily: D.font, fontSize: "0.36rem",
                letterSpacing: "0.1em", color,
                whiteSpace: "nowrap",
                fontWeight: active ? 700 : 400,
              }}>
                {step.label}
              </span>
            </button>

            {!isLast && (
              <div style={{
                width: 32, height: 2,
                background: currentIdx > i
                  ? \`linear-gradient(to right, \${D.green}, \${D.orange})\`
                  : "rgba(255,255,255,0.1)",
                transition: "background 0.3s",
                marginBottom: "1rem",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}`;

if (!src.includes(oldPipeline.substring(0, 60))) {
  console.error("pipeline component not found - check manually");
} else {
  src = src.replace(oldPipeline, newPipeline);
  console.log("pipeline patched ok");
}

writeFileSync(path, src, "utf8");
console.log("done");
