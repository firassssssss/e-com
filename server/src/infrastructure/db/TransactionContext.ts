import { AsyncLocalStorage } from 'async_hooks';

/**
 * AsyncLocalStorage instance to hold the database transaction object (tx).
 * This allows repositories to access the current transaction without it being passed explicitly through the core layer.
 */
export const transactionContext = new AsyncLocalStorage<any>();
