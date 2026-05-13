import pg from 'pg'; import dotenv from 'dotenv'; dotenv.config();
const p = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await p.query(`
  UPDATE conversation_logs
  SET intent = 'skincare'
  WHERE intent = 'off_topic'
    AND user_message ~* 'told you|just said|mentioned|my skin|my hair|my concern|what i said|remember|profile|skin type|hair type'
`);
const r = await p.query("SELECT intent, COUNT(*) FROM conversation_logs GROUP BY intent ORDER BY intent");
console.log(JSON.stringify(r.rows));
await p.end();
