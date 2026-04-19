/**
 * Transaction manager interface
 * Abstracts database transaction handling from the core layer
 */
export interface ITransactionManager {
    /**
     * Execute a function within a database transaction
     * If the function throws, the transaction is rolled back
     * 
     * @param fn - Function to execute within transaction
     * @returns Promise resolving to the function's return value
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
}
