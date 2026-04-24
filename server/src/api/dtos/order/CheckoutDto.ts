import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum PaymentMethod {
    CASH_ON_DELIVERY = 'cash_on_delivery',
    STRIPE = 'stripe'
}

export class CheckoutDto {
    @IsString()
    @IsNotEmpty()
    shippingAddress!: string;

    @IsString()
    @IsNotEmpty()
    paymentMethod!: string;
}
