import { Inject, Service } from 'typedi';
import { DomainEvent } from '../../core/events/DomainEvent.js';
import { IEventRegistry } from '../../core/events/IEventRegistry.js';
import { IEventListener, IParallelEventListener, IRetryableEventListener } from '../../core/events/IEventListener.js';

/**
 * Configuration for event processing behavior.
 */
export interface EventProcessorConfig {
  /** Default execution mode for listeners */
  defaultParallel: boolean;
  /** Default retry attempts for retryable listeners */
  defaultMaxRetries: number;
  /** Timeout for individual listener execution (ms) */
  listenerTimeout: number;
  /** Whether to continue processing other listeners if one fails */
  continueOnError: boolean;
}

/**
 * Result of processing an event.
 */
export interface EventProcessingResult {
  success: boolean;
  totalListeners: number;
  successfulListeners: number;
  failedListeners: number;
  errors: Array<{ listener: string; error: Error }>;
  processingTimeMs: number;
}

/**
 * Processes domain events by executing all registered listeners.
 * Supports parallel/sequential execution, retries, and error handling.
 */
@Service()
export class EventProcessor {
  private readonly config: EventProcessorConfig = {
    defaultParallel: false,
    defaultMaxRetries: 3,
    listenerTimeout: 30000, // 30 seconds
    continueOnError: true,
  };

  constructor(
    @Inject('IEventRegistry') private readonly eventRegistry: IEventRegistry) {}

  /**
   * Process a domain event by executing all registered listeners.
   *
   * @param event The domain event to process
   * @returns Processing result with success/failure details
   */
  async process(event: DomainEvent): Promise<EventProcessingResult> {
    const startTime = Date.now();
    const listeners = this.eventRegistry.getListenersString(event.type);

    console.log(`[EventProcessor] Processing event: ${event.type} with ${listeners.length} listeners`);

    if (listeners.length === 0) {
      console.warn(`[EventProcessor] No listeners registered for event type: ${event.type}`);
      return {
        success: true,
        totalListeners: 0,
        successfulListeners: 0,
        failedListeners: 0,
        errors: [],
        processingTimeMs: Date.now() - startTime,
      };
    }

    const errors: Array<{ listener: string; error: Error }> = [];
    const results: Array<{ success: boolean; listener: string; error?: Error }> = [];

    // Separate parallel and sequential listeners
    const parallelListeners: IEventListener<any>[] = [];
    const sequentialListeners: IEventListener<any>[] = [];

    for (const listener of listeners) {
      if (this.isParallelListener(listener) || this.config.defaultParallel) {
        parallelListeners.push(listener);
      } else {
        sequentialListeners.push(listener);
      }
    }

    // Execute parallel listeners first
    if (parallelListeners.length > 0) {
      console.log(`[EventProcessor] Executing ${parallelListeners.length} parallel listeners`);
      const parallelResults = await Promise.allSettled(
        parallelListeners.map(listener => this.executeListener(listener, event))
      );

      parallelResults.forEach((result, index) => {
        const listener = parallelListeners[index];
        const listenerName = listener.constructor.name;

        if (result.status === 'fulfilled') {
          results.push({ success: true, listener: listenerName });
        } else {
          const error = result.reason instanceof Error ? result.reason : new Error(String(result.reason));
          results.push({ success: false, listener: listenerName, error });
          errors.push({ listener: listenerName, error });
        }
      });
    }

    // Execute sequential listeners
    if (sequentialListeners.length > 0) {
      console.log(`[EventProcessor] Executing ${sequentialListeners.length} sequential listeners`);

      for (const listener of sequentialListeners) {
        const listenerName = listener.constructor.name;

        try {
          await this.executeListener(listener, event);
          results.push({ success: true, listener: listenerName });
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          results.push({ success: false, listener: listenerName, error: err });
          errors.push({ listener: listenerName, error: err });

          if (!this.config.continueOnError) {
            console.error(`[EventProcessor] Stopping processing due to error in ${listenerName}:`, err);
            break;
          }
        }
      }
    }

    const successfulListeners = results.filter(r => r.success).length;
    const failedListeners = results.filter(r => !r.success).length;
    const processingTimeMs = Date.now() - startTime;

    console.log(`[EventProcessor] Completed processing ${event.type}: ${successfulListeners}/${listeners.length} successful, ${processingTimeMs}ms`);

    if (errors.length > 0) {
      console.error(`[EventProcessor] ${errors.length} listeners failed:`, errors.map(e => `${e.listener}: ${e.error.message}`));
    }

    return {
      success: failedListeners === 0,
      totalListeners: listeners.length,
      successfulListeners,
      failedListeners,
      errors,
      processingTimeMs,
    };
  }

  /**
   * Execute a single listener with timeout and retry logic.
   */
  private async executeListener(listener: IEventListener<any>, event: DomainEvent): Promise<void> {
    const listenerName = listener.constructor.name;
    const maxRetries = this.isRetryableListener(listener)
      ? (listener.maxRetries ?? this.config.defaultMaxRetries)
      : 1;

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[EventProcessor] Executing ${listenerName} (attempt ${attempt}/${maxRetries})`);

        // Execute with timeout
        await Promise.race([
          listener.handle(event),
          this.createTimeout(this.config.listenerTimeout, `${listenerName} timeout`)
        ]);

        console.log(`[EventProcessor] Successfully executed ${listenerName}`);
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[EventProcessor] ${listenerName} failed (attempt ${attempt}/${maxRetries}):`, lastError.message);

        if (attempt === maxRetries) {
          throw lastError; // Final attempt failed
        }

        // Wait before retry (exponential backoff)
        await this.delay(Math.pow(2, attempt - 1) * 1000);
      }
    }
  }

  private isParallelListener(listener: IEventListener<any>): listener is IParallelEventListener<any> {
    return 'parallel' in listener && listener.parallel === true;
  }

  private isRetryableListener(listener: IEventListener<any>): listener is IRetryableEventListener<any> {
    return 'retryable' in listener && listener.retryable === true;
  }

  private createTimeout(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout: ${message}`)), ms);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update processor configuration.
   */
  updateConfig(config: Partial<EventProcessorConfig>): void {
    Object.assign(this.config, config);
    console.log('[EventProcessor] Configuration updated:', this.config);
  }

  /**
   * Get current processor configuration.
   */
  getConfig(): EventProcessorConfig {
    return { ...this.config };
  }
}
