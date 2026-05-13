import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const r1 = await pool.query('SELECT intent, COUNT(*) as count FROM conversation_logs GROUP BY intent');
console.log('=== intent breakdown ===');
console.log(JSON.stringify(r1.rows, null, 2));

const r2 = await pool.query('SELECT COUNT(*) as total FROM conversation_logs');
console.log('=== total rows ===', r2.rows[0]);

const r3 = await pool.query('SELECT * FROM conversation_logs ORDER BY created_at DESC LIMIT 3');
console.log('=== sample rows ===');
console.log(JSON.stringify(r3.rows, null, 2));

await pool.end();
