import { JsonController, Get, Post, Delete, Body, Param, QueryParam, Authorized, Res, CurrentUser } from 'routing-controllers';
import { Response } from 'express';
import { Service } from 'typedi';
import { BaseController } from './BaseController.js';
import { IGetCartUseCase } from '../../core/usecases/cart/GetCartUseCase.js';
import { IAddToCartUseCase } from '../../core/usecases/cart/AddToCartUseCase.js';
import { IRemoveFromCartUseCase } from '../../core/usecases/cart/RemoveFromCartUseCase.js';
import { IClearCartUseCase } from '../../core/usecases/cart/ClearCartUseCase.js';
import { AddToCartDto } from '../dtos/cart/AddToCartDto.js';
import Container from '../../config/Containers/AppContainers.js';

@JsonController('/cart')
@Service()
export class CartController extends BaseController {
    private getCartUseCase: IGetCartUseCase;
    private addToCartUseCase: IAddToCartUseCase;
    private removeFromCartUseCase: IRemoveFromCartUseCase;
    private clearCartUseCase: IClearCartUseCase;

    constructor() {
        super();
        this.getCartUseCase = Container.get('IGetCartUseCase') as IGetCartUseCase;
        this.addToCartUseCase = Container.get('IAddToCartUseCase') as IAddToCartUseCase;
        this.removeFromCartUseCase = Container.get('IRemoveFromCartUseCase') as IRemoveFromCartUseCase;
        this.clearCartUseCase = Container.get('IClearCartUseCase') as IClearCartUseCase;
    }

    @Get('/')
    @Authorized()
    async getCart(@CurrentUser() user: any, @Res() res: Response) {
        const result = await this.getCartUseCase.execute({ userId: user.id });
        return this.handleResultAsJson(result, res);
    }

    @Post('/')
    @Authorized()
    async addToCart(@CurrentUser() user: any, @Body() dto: AddToCartDto, @Res() res: Response) {
        const result = await this.addToCartUseCase.execute({
            userId: user.id,
            productId: dto.productId,
            quantity: dto.quantity,
            variantId: dto.variantId,
        });
        return this.handleResultAsJson(result, res);
    }

    @Delete('/clear')
    @Authorized()
    async clearCart(@CurrentUser() user: any, @Res() res: Response) {
        const result = await this.clearCartUseCase.execute({ userId: user.id });
        return this.handleResultAsJson(result, res);
    }

    @Delete('/:productId')
    @Authorized()
    async removeFromCart(
        @CurrentUser() user: any,
        @Param('productId') productId: string,
        @QueryParam('variantId') variantId: string | undefined,
        @Res() res: Response
    ) {
        const result = await this.removeFromCartUseCase.execute({
            userId: user.id,
            productId,
            variantId,
        });
        return this.handleResultAsJson(result, res);
    }
}
