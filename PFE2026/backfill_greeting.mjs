import pg from "pg"; import dotenv from "dotenv"; dotenv.config();
const p = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const r = await p.query(`
  UPDATE conversation_logs SET intent = 'greeting'
  WHERE intent != 'greeting'
    AND trim(lower(user_message)) IN (
      'hi there', 'hi there !', 'hello there',
      'maybe later thanks', 'maybe later',
      'ping', 'ping 1','ping 2','ping 3','ping 4','ping 5',
      'ping 6','ping 7','ping 8','ping 9','ping 10'
    )
  RETURNING user_message
`);
r.rows.forEach(r => console.log(" -", r.user_message));
console.log("Fixed:", r.rowCount);
await p.end();
