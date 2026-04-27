import { IsString, IsNotEmpty, IsEnum, MaxLength } from 'class-validator';

export enum PaymentMethod {
    CASH_ON_DELIVERY = 'cash_on_delivery',
    STRIPE           = 'stripe',
}

export class CheckoutDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(500, { message: 'Shipping address must be at most 500 characters' })
    shippingAddress!: string;

    @IsEnum(PaymentMethod, {
        message: `paymentMethod must be one of: ${Object.values(PaymentMethod).join(', ')}`,
    })
    paymentMethod!: PaymentMethod;
}
