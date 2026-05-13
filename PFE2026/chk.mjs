import pg from "pg"; import dotenv from "dotenv"; dotenv.config();
const p = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const r = await p.query(`
  SELECT user_message, intent 
  FROM conversation_logs 
  WHERE lower(trim(user_message)) IN ('hi there !','hi there','hello there','maybe later thanks')
`);
console.log(JSON.stringify(r.rows, null, 2));
await p.end();
