import { Service } from 'typedi';
import { ITransactionManager } from '../../core/repositories/ITransactionManager.js';
import { db } from '../../infrastructure/db/index.js';
import { transactionContext } from '../../infrastructure/db/TransactionContext.js';

/**
 * Drizzle ORM implementation of transaction manager
 * Wraps operations in db.transaction() and manages the transaction context
 */
@Service()
export class TransactionManager implements ITransactionManager {
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        console.log('[TransactionManager] Starting transaction...');
        try {
            return await db.transaction(async (tx) => {
                // Store the transaction object in AsyncLocalStorage
                return await transactionContext.run(tx, async () => {
                    const result = await fn();
                    console.log('[TransactionManager] Transaction committed successfully');
                    return result;
                });
            });
        } catch (error) {
            console.error('[TransactionManager] Transaction rolled back due to error:', error);
            throw error;
        }
    }
}
