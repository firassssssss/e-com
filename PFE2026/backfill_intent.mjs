import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const p = new pg.Pool({ connectionString: process.env.DATABASE_URL });
await p.query(`
  UPDATE conversation_logs
  SET intent = 'skincare'
  WHERE intent IS NULL
    AND user_message ~* 'skin|hair|serum|cream|moistur|oily|dry|acne|spf|glow|routine|cleanser|toner|recommend|product';

  UPDATE conversation_logs
  SET intent = 'off_topic'
  WHERE intent IS NULL;
`);
const r = await p.query("SELECT intent, COUNT(*) FROM conversation_logs GROUP BY intent ORDER BY intent");
console.log('Intent counts:', JSON.stringify(r.rows));
await p.end();
