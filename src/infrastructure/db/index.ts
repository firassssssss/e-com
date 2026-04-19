import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as schema from './schema/index.js';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env file');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

/**
 * Helper to get the current database instance.
 * If a transaction is active (within transactionContext), it returns the transaction instance.
 * Otherwise, it returns the main database instance.
 */
import { transactionContext } from './TransactionContext.js';
export const getDb = () => {
  const tx = transactionContext.getStore();
  return tx || db;
};

export const disconnect = async () => {
  await pool.end();
};
