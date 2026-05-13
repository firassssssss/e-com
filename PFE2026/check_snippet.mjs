import { readFileSync } from "fs";
const src = readFileSync("C:/e com/PFE2026/src/api/controllers/AdminController.ts", "utf8");
const idx = src.indexOf("userIds");
console.log(src.substring(idx, idx + 400));
