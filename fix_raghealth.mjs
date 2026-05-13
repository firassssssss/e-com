import { readFileSync, writeFileSync } from "fs";
const f = "C:/e com/frontend2/app/admin/analytics/page.tsx";
let c = readFileSync(f, "utf8");

// Fix 1: add ragHealth to function signature + type
c = c.replace(
  `function RecIntelligenceTab({ quality, signals, loadingQ, loadingS }: {
  quality: ChatQuality | null;
  signals: SignalsBreakdown | null;
  loadingQ: boolean;
  loadingS: boolean;
}) {`,
  `function RecIntelligenceTab({ quality, signals, loadingQ, loadingS, ragHealth }: {
  quality: ChatQuality | null;
  signals: SignalsBreakdown | null;
  loadingQ: boolean;
  loadingS: boolean;
  ragHealth: RagHealth | null;
}) {`
);

// Fix 2: pass ragHealth at the call site
c = c.replace(
  `<RecIntelligenceTab quality={quality} signals={signals} loadingQ={loadingQ} loadingS={loadingS} />`,
  `<RecIntelligenceTab quality={quality} signals={signals} loadingQ={loadingQ} loadingS={loadingS} ragHealth={ragHealth} />`
);

writeFileSync(f, c, "utf8");
const u = readFileSync(f, "utf8");
console.log("1. Signature fixed:", u.includes("loadingS, ragHealth }:"));
console.log("2. Type fixed:     ", u.includes("ragHealth: RagHealth | null;"));
console.log("3. Call site fixed:", u.includes("ragHealth={ragHealth}"));
