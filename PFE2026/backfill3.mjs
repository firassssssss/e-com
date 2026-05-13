import pg from 'pg'; import dotenv from 'dotenv'; dotenv.config();
const p = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await p.query(`
  UPDATE conversation_logs SET intent = 'greeting'
  WHERE intent = 'off_topic'
    AND user_message ~* '^\s*(hi|hello|hey|thanks|ok|okay|sure|bye|great|cool|awesome|noted)(\s+(there|again|mate|friend|lumina|bot))?\W*$'
`);
const r = await p.query("SELECT intent, COUNT(*) FROM conversation_logs GROUP BY intent ORDER BY intent");
console.log("Final counts:", JSON.stringify(r.rows));
await p.end();
