// import { JsonController, Get, Post, Put, Delete, Body, Param, Authorized, Res } from 'routing-controllers';
// import { Response } from 'express';
// import { Inject, Service } from 'typedi';
// import { BaseController } from './BaseController.js';
// import { ICreateProductVariantUseCase } from '../../core/usecases/product/variant/CreateProductVariantUseCase.js';
// import { IGetProductVariantUseCase } from '../../core/usecases/product/variant/GetProductVariantUseCase.js';
// import { IListProductVariantsUseCase } from '../../core/usecases/product/variant/ListProductVariantsUseCase.js';
// import { IUpdateProductVariantUseCase } from '../../core/usecases/product/variant/UpdateProductVariantUseCase.js';
// import { IDeleteProductVariantUseCase } from '../../core/usecases/product/variant/DeleteProductVariantUseCase.js';
// import { CreateProductVariantDto } from '../dtos/product/variant/CreateProductVariantDto.js';
// import { UpdateProductVariantDto } from '../dtos/product/variant/UpdateProductVariantDto.js';

// @JsonController('/products/:productId/variants')
// @Service()
// export class ProductVariantController extends BaseController {
//     constructor(
//         @Inject('ICreateProductVariantUseCase') private createUseCase: ICreateProductVariantUseCase,
//         @Inject('IGetProductVariantUseCase') private getUseCase: IGetProductVariantUseCase,
//         @Inject('IListProductVariantsUseCase') private listUseCase: IListProductVariantsUseCase,
//         @Inject('IUpdateProductVariantUseCase') private updateUseCase: IUpdateProductVariantUseCase,
//         @Inject('IDeleteProductVariantUseCase') private deleteUseCase: IDeleteProductVariantUseCase
//     ) {
//         super();
//     }

//     @Post('/')
//     @Authorized() // Admin only
//     async create(
//         @Param('productId') productId: string,
//         @Body() dto: CreateProductVariantDto,
//         @Res() res: Response
//     ) {
//         // Ensure productId in URL matches DTO or override it
//         dto.productId = productId;
//         const result = await this.createUseCase.execute(dto);
//         return this.handleResultAsJson(result, res);
//     }

//     @Get('/')
//     async list(@Param('productId') productId: string, @Res() res: Response) {
//         const result = await this.listUseCase.execute(productId);
//         return this.handleResultAsJson(result, res);
//     }

//     @Get('/:id')
//     async get(@Param('id') id: string, @Res() res: Response) {
//         const result = await this.getUseCase.execute(id);
//         return this.handleResultAsJson(result, res);
//     }

//     @Put('/:id')
//     @Authorized() // Admin only
//     async update(@Param('id') id: string, @Body() dto: UpdateProductVariantDto, @Res() res: Response) {
//         const result = await this.updateUseCase.execute({ id, ...dto });
//         return this.handleResultAsJson(result, res);
//     }

//     @Delete('/:id')
//     @Authorized() // Admin only
//     async delete(@Param('id') id: string, @Res() res: Response) {
//         const result = await this.deleteUseCase.execute(id);
//         return this.handleResultAsJson(result, res);
//     }
// }
import { JsonController, Get, Post, Put, Delete, Body, Param, Authorized, Res } from 'routing-controllers';
import { Response } from 'express';
import { Service } from 'typedi';
import { BaseController } from './BaseController.js';
import { ICreateProductVariantUseCase } from '../../core/usecases/product/variant/CreateProductVariantUseCase.js';
import { IGetProductVariantUseCase } from '../../core/usecases/product/variant/GetProductVariantUseCase.js';
import { IListProductVariantsUseCase } from '../../core/usecases/product/variant/ListProductVariantsUseCase.js';
import { IUpdateProductVariantUseCase } from '../../core/usecases/product/variant/UpdateProductVariantUseCase.js';
import { IDeleteProductVariantUseCase } from '../../core/usecases/product/variant/DeleteProductVariantUseCase.js';
import { CreateProductVariantDto } from '../dtos/product/variant/CreateProductVariantDto.js';
import { UpdateProductVariantDto } from '../dtos/product/variant/UpdateProductVariantDto.js';
import Container from '../../config/Containers/AppContainers.js';

@JsonController('/products/:productId/variants')
@Service()
export class ProductVariantController extends BaseController {
    private createUseCase: ICreateProductVariantUseCase;
    private getUseCase: IGetProductVariantUseCase;
    private listUseCase: IListProductVariantsUseCase;
    private updateUseCase: IUpdateProductVariantUseCase;
    private deleteUseCase: IDeleteProductVariantUseCase;

    constructor() {
        super();
        this.createUseCase = Container.get('ICreateProductVariantUseCase') as ICreateProductVariantUseCase;
        this.getUseCase = Container.get('IGetProductVariantUseCase') as IGetProductVariantUseCase;
        this.listUseCase = Container.get('IListProductVariantsUseCase') as IListProductVariantsUseCase;
        this.updateUseCase = Container.get('IUpdateProductVariantUseCase') as IUpdateProductVariantUseCase;
        this.deleteUseCase = Container.get('IDeleteProductVariantUseCase') as IDeleteProductVariantUseCase;
    }

    @Post('/')
    @Authorized()
    async create(@Param('productId') productId: string, @Body() dto: CreateProductVariantDto, @Res() res: Response) {
        dto.productId = productId;
        const result = await this.createUseCase.execute(dto);
        return this.handleResultAsJson(result, res);
    }

    @Get('/')
    async list(@Param('productId') productId: string, @Res() res: Response) {
        const result = await this.listUseCase.execute(productId);
        return this.handleResultAsJson(result, res);
    }

    @Get('/:id')
    async get(@Param('id') id: string, @Res() res: Response) {
        const result = await this.getUseCase.execute(id);
        return this.handleResultAsJson(result, res);
    }

    @Put('/:id')
    @Authorized()
    async update(@Param('id') id: string, @Body() dto: UpdateProductVariantDto, @Res() res: Response) {
        const result = await this.updateUseCase.execute({ id, ...dto });
        return this.handleResultAsJson(result, res);
    }

    @Delete('/:id')
    @Authorized()
    async delete(@Param('id') id: string, @Res() res: Response) {
        const result = await this.deleteUseCase.execute(id);
        return this.handleResultAsJson(result, res);
    }
}