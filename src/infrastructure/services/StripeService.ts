import { Service } from 'typedi';
import { IPaymentService, ChargeInput, ChargeResult } from '../../core/services/IPaymentService.js';
import { Result, ResultHelper } from '../../core/common/Result.js';
import { ErrorCode } from '../../core/common/Result.js';

@Service()
export class StripeService implements IPaymentService {
    async createCharge(input: ChargeInput): Promise<Result<ChargeResult>> {
        // Stub implementation
        console.log('StripeService stub: Creating charge', input);

        // Simulate successful charge for 'cash_on_delivery' (or logic handled in use case?)
        // Actually, PaymentService usually handles external gateway.
        // If payment method is not Stripe, maybe this service isn't called or handles it differently.

        return ResultHelper.success({
            paymentIntentId: 'stub_pi_' + Math.random().toString(36).substring(7),
            clientSecret: 'stub_secret',
            status: 'succeeded'
        });
    }

    async verifyWebhook(payload: string, signature: string): Promise<Result<boolean>> {
        return ResultHelper.success(true);
    }

    async refund(paymentIntentId: string): Promise<Result<void>> {
        return ResultHelper.success(undefined);
    }
}
