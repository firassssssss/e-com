import { readFileSync, writeFileSync } from "fs";
const path = "C:/e com/PFE2026/src/api/controllers/AdminController.ts";
let src = readFileSync(path, "utf8");
src = src.replace(
  /const userRows = userIds\.length\s*\? await db\.execute\(sql`\s*SELECT id, name, email FROM "user" WHERE id = ANY\(\$\{userIds\}\)\s*`\)\s*: \{ rows: \[\] \};/,
  `const userRows = userIds.length
      ? await db.execute(sql.raw('SELECT id, name, email FROM "user" WHERE id = ANY(ARRAY[' + userIds.map(id => "'" + id.replace(/'/g, "''") + "'").join(",") + '])'))
      : { rows: [] };`
);
writeFileSync(path, src, "utf8");
console.log("patched ok");
