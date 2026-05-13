import pg from 'pg'; import dotenv from 'dotenv'; dotenv.config();
const p = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const r = await p.query("SELECT type, COUNT(*) FROM user_signals GROUP BY type");
console.log(JSON.stringify(r.rows));
await p.end();
