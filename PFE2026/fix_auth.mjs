import pg from 'pg';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
console.log('Connected...');

await client.query('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean DEFAULT false NOT NULL');
console.log('two_factor_enabled added');

await client.query('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false');
console.log('banned added');

await client.query("INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('0006_normal_longshot', 1777832091998) ON CONFLICT DO NOTHING");
console.log('migration marked as applied');

await client.end();
console.log('Done!');
