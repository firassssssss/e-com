import { readFileSync, writeFileSync } from "fs";
const path = "C:/e com/frontend2/app/admin/orders/page.tsx";
let src = readFileSync(path, "utf8");

// Fix status counts
src = src
  .replace(/orders\.filter\(o => o\.status === "pending"\)\.length/, 'orders.filter(o => o.status === "PENDING").length')
  .replace(/orders\.filter\(o => o\.status === "confirmed"\)\.length/, 'orders.filter(o => o.status === "CONFIRMED").length')
  .replace(/orders\.filter\(o => o\.status === "on_the_way"\)\.length/, 'orders.filter(o => o.status === "ON_THE_WAY").length')
  .replace(/orders\.filter\(o => o\.status === "delivered"\)\.length/, 'orders.filter(o => o.status === "DELIVERED").length')
  .replace(/orders\.filter\(o => o\.status === "cancelled"\)\.length/, 'orders.filter(o => o.status === "CANCELLED").length');

// Replace entire StatusPipeline with regex
src = src.replace(
  /\/\/ -- Status pipeline component[^/]*function StatusPipeline[\s\S]*?\n\}/,
  `// -- Status pipeline component -------------------------------------------------
const STATUS_ORDER = ["PENDING", "CONFIRMED", "ON_THE_WAY", "DELIVERED"];

function StatusPipeline({ order, onUpdate }: { order: Order; onUpdate: (id: string, status: string) => void }) {
  const [loading, setLoading] = useState(false);
  const currentIdx = STATUS_ORDER.indexOf(order.status);

  async function handleClick(step: { key: string }) {
    if (loading) return;
    const stepIdx = STATUS_ORDER.indexOf(step.key);
    // if clicking the current active step ? uncheck (go back one)
    // if clicking a future step ? advance to it
    // if clicking a past step ? revert to it
    const newStatus = step.key === order.status
      ? STATUS_ORDER[Math.max(0, stepIdx - 1)]
      : step.key;
    if (newStatus === order.status) return;
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
        const stepIdx = STATUS_ORDER.indexOf(step.key);
        const checked = currentIdx >= stepIdx;
        const active  = order.status === step.key;
        const color   = checked ? (active ? D.orange : D.green) : "rgba(255,255,255,0.15)";
        const isLast  = i === PIPELINE.length - 1;
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center" }}>
            <button
              onClick={() => handleClick(step)}
              disabled={loading}
              title={active ? "Click to uncheck" : \`Set to \${step.label}\`}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
                background: "none", border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                padding: "0.2rem 0.5rem", opacity: loading ? 0.5 : 1,
              }}
            >
              {/* checkbox-style circle */}
              <div style={{
                width: 14, height: 14, borderRadius: "50%",
                background: checked ? color : "transparent",
                border: \`2px solid \${color}\`,
                boxShadow: active ? \`0 0 10px \${color}\` : "none",
                transform: active ? "scale(1.3)" : "scale(1)",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {checked && (
                  <div style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: active ? "#fff" : "rgba(0,0,0,0.5)",
                  }} />
                )}
              </div>
              <span style={{
                fontFamily: "'Syncopate', sans-serif",
                fontSize: "0.34rem", letterSpacing: "0.1em",
                color: checked ? color : "rgba(255,255,255,0.2)",
                whiteSpace: "nowrap",
                fontWeight: active ? 700 : 400,
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
}`
);

writeFileSync(path, src, "utf8");
console.log("done");
