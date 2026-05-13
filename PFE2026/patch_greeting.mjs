import { readFileSync, writeFileSync } from "fs";
const f = "C:/e com/PFE2026/src/api/controllers/ChatController.ts";
let c = readFileSync(f, "utf8");

// 1. Replace old GREETING_PATTERN with expanded version + add BOT_META_PATTERN
c = c.replace(
  /const GREETING_PATTERN = \/\^\\s\*\(hi\|hello[\s\S]*?\/i;/,
  `const GREETING_PATTERN = /^\\s*(h{1,3}[iy]+|h{1,3}e+l+[o0]+|h{1,3}e+y+|good\\s*(morning|afternoon|evening|night|day)|thanks?(\\s+you)?|thank\\s+you|thx|ty|ok+a?y?|sure|yep+|yeah+|yup|yes+|nope|maybe(\\s+later)?|not\\s+now|no\\s+thanks?|bye+|goodbye|see\\s*ya|great|perfect|got\\s*it|understood|nice|cool|awesome|sounds?\\s*good|alright|noted|wonderful|\u0645\u0631\u062d\u0628\u0627|\u0623\u0647\u0644\u0627|\u0627\u0644\u0633\u0644\u0627\u0645\\s*\u0639\u0644\u064a\u0643\u0645|\u0645\u0633\u0627\u0621\\s*\u0627\u0644\u062e\u064a\u0631|\u0635\u0628\u0627\u062d\\s*\u0627\u0644\u062e\u064a\u0631|bonjour|salut|bonsoir|merci|hola|gracias|ciao)(\\s+(there|again|mate|friend|lumina|bot|everyone|all))?\\W*$/i;

const BOT_META_PATTERN = /^\\s*(are\\s+you|what\\s+are\\s+you|who\\s+are\\s+you|is\\s+this\\s+(an?\\s*)?(ai|bot|chatbot)|you'?re\\s+an?\\s*(ai|bot)|what\\s+is\\s+(lumina|this\\s+bot))\\b/i;`
);

writeFileSync(f, c, "utf8");

// Verify
const updated = readFileSync(f, "utf8");
console.log("BOT_META_PATTERN defined:", updated.includes("BOT_META_PATTERN = /"));
console.log("h{1,3} present:", updated.includes("h{1,3}"));
console.log("bonjour present:", updated.includes("bonjour"));
