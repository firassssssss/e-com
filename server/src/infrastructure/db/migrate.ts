import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index.js'; // Adjust if your db instance is exported differently
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env file for migrations');
  }
  console.log('Starting migrations...');
  try {
    // The migrationsFolder path is relative to the location of this script
    // or an absolute path. Here, it assumes migrations are in a 'drizzle/migrations'
    // folder at the project root, which matches drizzle.config.ts.
    // If this script is in src/infrastructure/db, and drizzle.config.ts out is './drizzle/migrations',
    // the relative path from here to the migrations folder is '../../../drizzle/migrations'
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    console.log('Migrations completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

main();
