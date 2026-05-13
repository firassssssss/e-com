import pg from "pg"; import dotenv from "dotenv"; dotenv.config();
const p = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const r = await p.query(`
  UPDATE conversation_logs SET intent = 'skincare'
  WHERE intent = 'off_topic'
    AND (
      lower(user_message) ~ '(s[eé]rum|cr[eè]me|soin|peau|grasse|s[eè]che|cheveux)'
      OR user_message ~ '(\u0628\u0634\u0631\u0629|\u0643\u0631\u064a\u0645|\u0633\u064a\u0631\u0648\u0645|\u0634\u0639\u0631|\u062f\u0647\u0646\u064a\u0629)'
      OR lower(user_message) ~ '(sunscreen|moistur|serum|cleanser|spf)'
    )
  RETURNING user_message
`);
r.rows.forEach(r => console.log(" -", r.user_message));
console.log("Fixed:", r.rowCount);
await p.end();
