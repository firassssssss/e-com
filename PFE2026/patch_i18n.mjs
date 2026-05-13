import { readFileSync, writeFileSync } from "fs";
const f = "C:/e com/PFE2026/src/api/controllers/ChatController.ts";
let c = readFileSync(f, "utf8");

// Add i18n keywords after SKINCARE_KEYWORDS line
c = c.replace(
  /const SKINCARE_KEYWORDS = \/.*?\/i\n/,
  (match) => match + `const SKINCARE_KEYWORDS_I18N = /s\u00e9rum|cr\u00e8me|soin|peau|grasse|s\u00e8che|cheveux|\u0628\u0634\u0631\u0629|\u0643\u0631\u064a\u0645|\u0633\u064a\u0631\u0648\u0645|\u0634\u0639\u0631|\u062f\u0647\u0646\u064a\u0629|\u062c\u0627\u0641\u0629|\u062a\u0642\u0634\u064a\u0631|\u062a\u0631\u0637\u064a\u0628/i;\n`
);

// Update isSkincareQ to use both
c = c.replace(
  "const isSkincareQ = SKINCARE_KEYWORDS.test(userMessage);",
  "const isSkincareQ = SKINCARE_KEYWORDS.test(userMessage) || SKINCARE_KEYWORDS_I18N.test(userMessage);"
);

writeFileSync(f, c, "utf8");
const updated = readFileSync(f, "utf8");
console.log("i18n defined:", updated.includes("SKINCARE_KEYWORDS_I18N"));
console.log("isSkincareQ updated:", updated.includes("SKINCARE_KEYWORDS_I18N.test"));
