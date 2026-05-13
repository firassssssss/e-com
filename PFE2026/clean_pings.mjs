import pg from 'pg'; import dotenv from 'dotenv'; dotenv.config();
const p = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const del = await p.query(`
  DELETE FROM conversation_logs
  WHERE user_message ~* '^\s*ping\s*\d*\s*$'
`);
console.log("Deleted ping rows:", del.rowCount);
const r = await p.query("SELECT intent, COUNT(*) FROM conversation_logs GROUP BY intent ORDER BY intent");
console.log("Remaining:", JSON.stringify(r.rows));
await p.end();
