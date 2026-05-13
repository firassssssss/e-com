import { readFileSync, writeFileSync } from "fs";

// ── Fix 1: GetChatHealthUseCase hallucinationRate ──────────────────────────
const f1 = "C:/e com/PFE2026/src/core/usecases/admin/GetChatHealthUseCase.ts";
let c1 = readFileSync(f1, "utf8");

c1 = c1.replace(
  `const hallucinationCount = logs.filter(l =>
      l.intent === "off_topic" || l.intent === "no_rag_context"
    ).length;`,
  `// Hallucination = bot gave a long reply to an off_topic query (failed to refuse)
    // Short reply = correct refusal ("I only help with skincare") = NOT a hallucination
    const hallucinationCount = logs.filter(l => {
      if (l.intent !== "off_topic") return false;
      const reply = (l.botMessages as any[])?.[0]?.text ?? "";
      return reply.length > 120;
    }).length;`
);

writeFileSync(f1, c1, "utf8");
console.log("Fix 1 applied:", readFileSync(f1, "utf8").includes("reply.length > 120"));
