import { Service } from 'typedi';
import { IPaymentService, ChargeInput, ChargeResult } from '../../core/services/IPaymentService.js';
import { Result, ResultHelper } from '../../core/common/Result.js';
import { ErrorCode } from '../../core/common/Result.js';

@Service()
export class StripeService implements IPaymentService {
    // ── NOTE: Full Stripe integration is not yet implemented.
    // To enable card payments:
    //   1. npm install stripe
    //   2. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env
    //   3. Implement createCharge using Stripe PaymentIntents API
    //   4. Update the frontend checkout to use Stripe.js + CardElement
    //      (NEVER collect raw card data through your own backend — PCI DSS)
    //
    // Until then, the 'stripe' payment method is explicitly rejected so that
    // no orders are created with fake payment IDs.

    async createCharge(_input: ChargeInput): Promise<Result<ChargeResult>> {
        return ResultHelper.failure(
            'Card payments are not yet available. Please choose Cash on Delivery.',
            ErrorCode.EXTERNAL_SERVICE_ERROR,
        );
    }

    async verifyWebhook(_payload: string, _signature: string): Promise<Result<boolean>> {
        return ResultHelper.failure(
            'Stripe webhooks are not configured.',
            ErrorCode.EXTERNAL_SERVICE_ERROR,
        );
    }

    async refund(_paymentIntentId: string): Promise<Result<void>> {
        return ResultHelper.failure(
            'Refunds via Stripe are not yet implemented.',
            ErrorCode.EXTERNAL_SERVICE_ERROR,
        );
    }
}
