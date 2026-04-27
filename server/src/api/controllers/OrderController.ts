import { JsonController, Get, Post, Body, Param, CurrentUser, Authorized, Res } from 'routing-controllers';
import { Response } from 'express';
import { Service } from 'typedi';
import { BaseController } from './BaseController.js';
import { ICheckoutUseCase } from '../../core/usecases/order/CheckoutUseCase.js';
import { IOrderRepository } from '../../core/repositories/IOrderRepository.js';
import { ResultHelper, ErrorCode } from '../../core/common/Result.js';
import { CheckoutDto } from '../dtos/order/CheckoutDto.js';
import Container from '../../config/Containers/AppContainers.js';

@JsonController('/orders')
@Service()
@Authorized()
export class OrderController extends BaseController {
    private checkoutUseCase: ICheckoutUseCase;
    private orderRepository: IOrderRepository;

    constructor() {
        super();
        this.checkoutUseCase = Container.get('ICheckoutUseCase') as ICheckoutUseCase;
        this.orderRepository = Container.get('IOrderRepository') as IOrderRepository;
    }

    @Post('/checkout')
    async checkout(@CurrentUser() user: { id: string }, @Body() body: CheckoutDto, @Res() res: Response) {
        const result = await this.checkoutUseCase.execute({
            userId: user.id,
            shippingAddress: body.shippingAddress,
            paymentMethod: body.paymentMethod,
        });
        return this.handleResultAsJson(result, res);
    }

    @Get('/')
    async listOrders(@CurrentUser() user: { id: string }, @Res() res: Response) {
        const orders = await this.orderRepository.findByUserId(user.id);
        return this.handleResultAsJson(ResultHelper.success(orders), res);
    }

    @Get('/:id')
    async getOrder(@CurrentUser() user: { id: string }, @Param('id') id: string, @Res() res: Response) {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            return this.handleResultAsJson(ResultHelper.failure('Order not found', ErrorCode.NOT_FOUND), res);
        }
        if (order.userId !== user.id) {
            return this.handleResultAsJson(ResultHelper.failure('Unauthorized', ErrorCode.FORBIDDEN), res);
        }
        return this.handleResultAsJson(ResultHelper.success(order), res);
    }
}
