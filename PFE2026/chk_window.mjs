import pg from 'pg'; import dotenv from 'dotenv'; dotenv.config();
const p = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const r = await p.query(`
  SELECT COUNT(*) as total,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
  FROM conversation_logs
  WHERE created_at >= NOW() - INTERVAL '30 days'
`);
console.log(JSON.stringify(r.rows[0]));
await p.end();
