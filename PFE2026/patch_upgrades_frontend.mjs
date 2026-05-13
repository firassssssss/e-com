import { readFileSync, writeFileSync } from "fs";
const f = "C:/e com/frontend2/app/admin/analytics/page.tsx";
let c = readFileSync(f, "utf8");

// ── 1. Extend ChatQuality interface ────────────────────────────────────────
c = c.replace(
  `interface ChatQuality { summary: QualitySummaryRow[]; offTopicSample: QualitySample[]; noRagSample: QualitySample[]; }`,
  `interface ChatQuality { summary: QualitySummaryRow[]; offTopicSample: QualitySample[]; noRagSample: QualitySample[]; orderGapSample: QualitySample[]; langBreakdown: { arabic: number; french: number; english: number; other: number } | null; }
interface RagHealth { status: string; vectors: number; ml_classifier: string; }`
);

// ── 2. Add ragHealth state + fetch inside AdminAnalyticsPage ───────────────
c = c.replace(
  `  const [loadingQ, setLoadingQ]               = useState(true);`,
  `  const [loadingQ, setLoadingQ]               = useState(true);
  const [ragHealth, setRagHealth]               = useState<RagHealth | null>(null);`
);

c = c.replace(
  `  useEffect(() => {
    setLoadingQ(true);
    api.get(\`/api/admin/chat/quality?days=\${period === "day" ? 1 : period === "week" ? 7 : 30}\`)
      .then(r => setQuality(r.data.data)).finally(() => setLoadingQ(false));
  }, [period]);`,
  `  useEffect(() => {
    setLoadingQ(true);
    api.get(\`/api/admin/chat/quality?days=\${period === "day" ? 1 : period === "week" ? 7 : 30}\`)
      .then(r => setQuality(r.data.data)).finally(() => setLoadingQ(false));
    api.get("/api/admin/rag/health").then(r => setRagHealth(r.data.data)).catch(() => {});
  }, [period]);`
);

// ── 3. Pass ragHealth + langBreakdown into RecIntelligenceTab ──────────────
c = c.replace(
  `        {tab === "rec_intel" && (
          <RecIntelligenceTab quality={quality} signals={signals} loadingQ={loadingQ} loadingS={loadingS} />
        )}`,
  `        {tab === "rec_intel" && (
          <RecIntelligenceTab quality={quality} signals={signals} loadingQ={loadingQ} loadingS={loadingS} ragHealth={ragHealth} />
        )}`
);

// ── 4. Update RecIntelligenceTab signature ─────────────────────────────────
c = c.replace(
  `function RecIntelligenceTab({ quality, signals, loadingQ, loadingS }: {
  quality: ChatQuality | null;
  signals: SignalsBreakdown | null;
  loadingQ: boolean;
  loadingS: boolean;
})`,
  `function RecIntelligenceTab({ quality, signals, loadingQ, loadingS, ragHealth }: {
  quality: ChatQuality | null;
  signals: SignalsBreakdown | null;
  loadingQ: boolean;
  loadingS: boolean;
  ragHealth: RagHealth | null;
})`
);

// ── 5. Add sampleTab option for order gap ─────────────────────────────────
c = c.replace(
  `  const [sampleTab, setSampleTab] = useState<"off_topic" | "no_rag">("off_topic");`,
  `  const [sampleTab, setSampleTab] = useState<"off_topic" | "no_rag" | "order_gap">("off_topic");`
);

// ── 6. Add RAG health + lang breakdown widgets before Charts row ───────────
c = c.replace(
  `      {/* -- Charts row -- */}`,
  `      {/* -- RAG Health + Language Breakdown -- */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={{ background: D.panel, border: \`1px solid \${ragHealth?.status === "ok" ? "rgba(0,255,170,0.3)" : "rgba(255,68,68,0.3)"}\`, borderRadius: 4, padding: "1.5rem" }}>
          <p style={{ fontFamily: D.font, fontSize: "0.55rem", letterSpacing: "0.15em", color: D.text, marginBottom: 4 }}>RAG Service Health</p>
          <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.dim, marginBottom: "1rem" }}>Vector store status and indexed product count</p>
          <div style={{ display: "flex", gap: "1rem" }}>
            {[
              { label: "STATUS", value: ragHealth?.status ?? "—", color: ragHealth?.status === "ok" ? D.green : D.red },
              { label: "VECTORS", value: ragHealth ? String(ragHealth.vectors) : "—", color: D.text },
              { label: "ML CLASSIFIER", value: ragHealth?.ml_classifier ?? "—", color: ragHealth?.ml_classifier === "ready" ? D.green : D.yellow },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flex: 1, background: D.panelB, border: \`1px solid \${D.border}\`, borderRadius: 4, padding: "1rem" }}>
                <p style={{ fontFamily: D.font, fontSize: "0.38rem", letterSpacing: "0.15em", color: D.dim, marginBottom: "0.5rem" }}>{label}</p>
                <p style={{ fontFamily: D.mono, fontSize: "1.1rem", fontWeight: 700, color, textTransform: "uppercase" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: D.panel, border: \`1px solid \${D.border}\`, borderRadius: 4, padding: "1.5rem" }}>
          <p style={{ fontFamily: D.font, fontSize: "0.55rem", letterSpacing: "0.15em", color: D.text, marginBottom: 4 }}>User Language Breakdown</p>
          <p style={{ fontFamily: D.font, fontSize: "0.42rem", letterSpacing: "0.12em", color: D.dim, marginBottom: "1rem" }}>Languages detected in chat messages</p>
          {loadingQ ? <div style={{ color: D.dim }}>Loading…</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {quality?.langBreakdown && Object.entries(quality.langBreakdown).map(([lang, count]) => {
                const total = Object.values(quality.langBreakdown!).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((count / total) * 100);
                const color = lang === "arabic" ? "#FFD700" : lang === "french" ? "#00FFAA" : lang === "english" ? "#00FFFF" : D.dim;
                return (
                  <div key={lang} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontFamily: D.font, fontSize: "0.4rem", letterSpacing: "0.12em", color: D.dim, width: 60, textTransform: "capitalize" }}>{lang}</span>
                    <div style={{ flex: 1, height: 5, background: D.border, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: \`\${pct}%\`, background: color, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: D.mono, fontSize: "0.75rem", color: D.text, width: 32, textAlign: "right" }}>{count}</span>
                    <span style={{ fontFamily: D.mono, fontSize: "0.68rem", color: D.dim, width: 32, textAlign: "right" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* -- Charts row -- */}`
);

// ── 7. Add order gap tab button to Problem Messages header ─────────────────
c = c.replace(
  `            {([["off_topic", "Off-Topic", D.red], ["no_rag", "No RAG Match", D.yellow]] as const).map(([key, label, color]) => (`,
  `            {([["off_topic", "Off-Topic", D.red], ["no_rag", "No RAG Match", D.yellow], ["order_gap", "Order Requests", D.cyan]] as const).map(([key, label, color]) => (`
);

// ── 8. Update tab icon logic + count ──────────────────────────────────────
c = c.replace(
  `                {key === "off_topic" ? <AlertTriangle size={10} /> : <HelpCircle size={10} />}
                {label} ({key === "off_topic" ? offTopicCount : noRagCount})`,
  `                {key === "off_topic" ? <AlertTriangle size={10} /> : key === "no_rag" ? <HelpCircle size={10} /> : <ShoppingBag size={10} />}
                {label} ({key === "off_topic" ? offTopicCount : key === "no_rag" ? noRagCount : (quality?.orderGapSample?.length ?? 0)})`
);

// ── 9. Update sample data source to include order_gap ─────────────────────
c = c.replace(
  `          ) : (sampleTab === "off_topic" ? quality?.offTopicSample : quality?.noRagSample)?.length === 0 ? (`,
  `          ) : (sampleTab === "off_topic" ? quality?.offTopicSample : sampleTab === "no_rag" ? quality?.noRagSample : quality?.orderGapSample)?.length === 0 ? (`
);
c = c.replace(
  `            <p style={{ fontFamily: D.font, fontSize: "0.45rem", letterSpacing: "0.15em", color: D.green }}>
                {sampleTab === "off_topic" ? "No off-topic messages" : "No unmatched skincare queries"}
              </p>`,
  `            <p style={{ fontFamily: D.font, fontSize: "0.45rem", letterSpacing: "0.15em", color: D.green }}>
                {sampleTab === "off_topic" ? "No off-topic messages" : sampleTab === "no_rag" ? "No unmatched skincare queries" : "No order-related requests"}
              </p>`
);
c = c.replace(
  `            (sampleTab === "off_topic" ? quality?.offTopicSample : quality?.noRagSample)?.map(s => (`,
  `            (sampleTab === "off_topic" ? quality?.offTopicSample : sampleTab === "no_rag" ? quality?.noRagSample : quality?.orderGapSample)?.map(s => (`
);
c = c.replace(
  `                {sampleTab === "off_topic"
                    ? <AlertTriangle size={13} color={D.red} />
                    : <HelpCircle size={13} color={D.yellow} />}`,
  `                {sampleTab === "off_topic"
                    ? <AlertTriangle size={13} color={D.red} />
                    : sampleTab === "no_rag"
                    ? <HelpCircle size={13} color={D.yellow} />
                    : <ShoppingBag size={13} color={D.cyan} />}`
);

writeFileSync(f, c, "utf8");
const u = readFileSync(f, "utf8");
console.log("ragHealth state:", u.includes("ragHealth"));
console.log("langBreakdown widget:", u.includes("langBreakdown"));
console.log("orderGapSample tab:", u.includes("orderGapSample"));
console.log("RAG health widget:", u.includes("RAG Service Health"));
