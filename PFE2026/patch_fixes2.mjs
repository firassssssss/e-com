import { readFileSync, writeFileSync } from "fs";

const f2 = "C:/e com/frontend2/app/admin/analytics/page.tsx";
let c2 = readFileSync(f2, "utf8");

// Fix 2: Wrong label on Off-Topic stat card
c2 = c2.replace(
  `"Hallucination / out-of-scope replies"`,
  `"Out-of-scope refusals (correctly handled)"`
);

// Fix 3: Period filter not applied to quality fetch
c2 = c2.replace(
  `api.get(\`/api/admin/chat/quality?days=30\`)`,
  `api.get(\`/api/admin/chat/quality?days=\${period === "day" ? 1 : period === "week" ? 7 : 30}\`)`
);

writeFileSync(f2, c2, "utf8");
const updated = readFileSync(f2, "utf8");
console.log("Fix 2 applied:", updated.includes("Out-of-scope refusals"));
console.log("Fix 3 applied:", updated.includes('period === "day" ? 1'));
