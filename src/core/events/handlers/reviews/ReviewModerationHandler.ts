import { Service, Inject } from 'typedi';
import { IEventListener } from '../../IEventListener.js';
import { DomainEvent } from '../../DomainEvent.js';
import { ReviewCreatedPayload } from '../../ReviewCreatedEvent.js';

@Service()
export class ReviewModerationHandler implements IEventListener<ReviewCreatedPayload> {
    eventType = 'REVIEW_CREATED';

    constructor(
        @Inject('IAuditLogRepository') private readonly auditLog: any
    ) {}

    async handle(event: DomainEvent<ReviewCreatedPayload>): Promise<void> {
        // Log this for the Security/Admin Audit (PFE Requirement 7.5)
        await this.auditLog.logAction({
            action: 'REVIEW_PENDING',
            details: `Review ${event.payload.reviewId} created for product ${event.payload.productId}`
        });
    }
}
