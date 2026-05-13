import pg from 'pg'; import dotenv from 'dotenv'; dotenv.config();
const p = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const r = await p.query(`
  SELECT DATE(created_at) as date, COUNT(*) as total
  FROM user_signals
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(created_at)
  ORDER BY date DESC LIMIT 10
`);
console.log(JSON.stringify(r.rows));
await p.end();
