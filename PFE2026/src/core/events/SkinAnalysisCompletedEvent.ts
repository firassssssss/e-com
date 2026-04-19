import { BaseDomainEvent } from './BaseDomainEvent.js';

export interface SkinAnalysisPayload {
    userId: string;
    skinType: string; // e.g., 'Oily', 'Dry'
    concerns: string[]; // e.g., ['Acne', 'Dark Spots']
}

export class SkinAnalysisCompletedEvent extends BaseDomainEvent<SkinAnalysisPayload> {
    constructor(payload: SkinAnalysisPayload) {
        super('SKIN_ANALYSIS_COMPLETED', payload);
    }
}
