// import { JsonController, Get, Post, Delete, Body, Param, Authorized, Res, CurrentUser } from 'routing-controllers';
// import { Response } from 'express';
// import { Inject, Service } from 'typedi';
// import { BaseController } from './BaseController.js';
// import { IGetWishlistUseCase } from '../../core/usecases/wishlist/GetWishlistUseCase.js';
// import { IAddItemToWishlistUseCase } from '../../core/usecases/wishlist/AddItemToWishlistUseCase.js';
// import { IRemoveItemFromWishlistUseCase } from '../../core/usecases/wishlist/RemoveItemFromWishlistUseCase.js';
// import { AddToWishlistDto } from '../dtos/wishlist/AddToWishlistDto.js';

// @JsonController('/wishlist')
// @Service()
// export class WishlistController extends BaseController {
//     constructor(
//         @Inject('IGetWishlistUseCase') private getWishlistUseCase: IGetWishlistUseCase,
//         @Inject('IAddItemToWishlistUseCase') private addItemToWishlistUseCase: IAddItemToWishlistUseCase,
//         @Inject('IRemoveItemFromWishlistUseCase') private removeItemFromWishlistUseCase: IRemoveItemFromWishlistUseCase
//     ) {
//         super();
//     }

//     @Get('/')
//     @Authorized()
//     async get(@CurrentUser() user: { id: string }, @Res() res: Response) {
//         const result = await this.getWishlistUseCase.execute(user.id);
//         return this.handleResultAsJson(result, res);
//     }

//     @Post('/items')
//     @Authorized()
//     async addItem(@Body() dto: AddToWishlistDto, @CurrentUser() user: { id: string }, @Res() res: Response) {
//         const result = await this.addItemToWishlistUseCase.execute(user.id, dto.productId);
//         return this.handleResultAsJson(result, res);
//     }

//     @Delete('/items/:productId')
//     @Authorized()
//     async removeItem(@Param('productId') productId: string, @CurrentUser() user: { id: string }, @Res() res: Response) {
//         const result = await this.removeItemFromWishlistUseCase.execute(user.id, productId);
//         return this.handleResultAsJson(result, res);
//     }
// }
import { JsonController, Get, Post, Delete, Body, Param, Authorized, Res, CurrentUser } from 'routing-controllers';
import { Response } from 'express';
import { Service } from 'typedi';
import { BaseController } from './BaseController.js';
import { IGetWishlistUseCase } from '../../core/usecases/wishlist/GetWishlistUseCase.js';
import { IAddItemToWishlistUseCase } from '../../core/usecases/wishlist/AddItemToWishlistUseCase.js';
import { IRemoveItemFromWishlistUseCase } from '../../core/usecases/wishlist/RemoveItemFromWishlistUseCase.js';
import { AddToWishlistDto } from '../dtos/wishlist/AddToWishlistDto.js';
import Container from '../../config/Containers/AppContainers.js';

@JsonController('/wishlist')
@Service()
export class WishlistController extends BaseController {
    private getWishlistUseCase: IGetWishlistUseCase;
    private addItemToWishlistUseCase: IAddItemToWishlistUseCase;
    private removeItemFromWishlistUseCase: IRemoveItemFromWishlistUseCase;

    constructor() {
        super();
        this.getWishlistUseCase = Container.get('IGetWishlistUseCase') as IGetWishlistUseCase;
        this.addItemToWishlistUseCase = Container.get('IAddItemToWishlistUseCase') as IAddItemToWishlistUseCase;
        this.removeItemFromWishlistUseCase = Container.get('IRemoveItemFromWishlistUseCase') as IRemoveItemFromWishlistUseCase;
    }

    @Get('/')
    @Authorized()
    async get(@CurrentUser() user: { id: string }, @Res() res: Response) {
        const result = await this.getWishlistUseCase.execute(user.id);
        return this.handleResultAsJson(result, res);
    }

    @Post('/items')
    @Authorized()
    async addItem(@Body() dto: AddToWishlistDto, @CurrentUser() user: { id: string }, @Res() res: Response) {
        const result = await this.addItemToWishlistUseCase.execute(user.id, dto.productId);
        return this.handleResultAsJson(result, res);
    }

    @Delete('/items/:productId')
    @Authorized()
    async removeItem(@Param('productId') productId: string, @CurrentUser() user: { id: string }, @Res() res: Response) {
        const result = await this.removeItemFromWishlistUseCase.execute(user.id, productId);
        return this.handleResultAsJson(result, res);
    }
}