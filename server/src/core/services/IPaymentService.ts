import { Result } from '../common/Result.js';

export interface ChargeInput {
    amount: number;
    currency: string;
    orderId: string;
    userId: string;
}

export interface ChargeResult {
    paymentIntentId: string;
    clientSecret: string;  // For frontend
    status: 'succeeded' | 'pending' | 'failed';
}

export interface IPaymentService {
    createCharge(input: ChargeInput): Promise<Result<ChargeResult>>;
    verifyWebhook(payload: string, signature: string): Promise<Result<boolean>>;
    refund(paymentIntentId: string): Promise<Result<void>>;
}
