import pg from 'pg'; import dotenv from 'dotenv'; dotenv.config();
const p = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const r1 = await p.query("SELECT intent, COUNT(*) FROM conversation_logs GROUP BY intent ORDER BY intent");
console.log("DB intents:", JSON.stringify(r1.rows));
const r2 = await p.query("SELECT user_message, intent FROM conversation_logs WHERE intent = 'off_topic' LIMIT 10");
console.log("Sample off_topic msgs:", JSON.stringify(r2.rows));
await p.end();
