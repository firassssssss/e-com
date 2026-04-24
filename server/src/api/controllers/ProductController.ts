import { JsonController, Get, Post, Param, Body, Res, QueryParam } from 'routing-controllers';
import { Response } from 'express';
import { Service } from 'typedi';
import { OpenAPI } from 'routing-controllers-openapi';
import { BaseController } from './BaseController.js';
import { CreateProductDto } from '../dtos/product/CreateProductDto.js';
import { IGetProductUseCase } from '../../core/usecases/product/GetProductUseCase.js';
import { ICreateProductUseCase } from '../../core/usecases/product/CreateProductUseCase.js';
import { IListProductsUseCase } from '../../core/usecases/product/ListProductsUseCase.js';
import Container from '../../config/Containers/AppContainers.js';

@JsonController('/products')
@Service()
export class ProductController extends BaseController {
  private getProductUseCase: IGetProductUseCase;
  private createProductUseCase: ICreateProductUseCase;
  private listProductsUseCase: IListProductsUseCase;

  constructor() {
    super();
    this.getProductUseCase = Container.get('IGetProductUseCase') as IGetProductUseCase;
    this.createProductUseCase = Container.get('ICreateProductUseCase') as ICreateProductUseCase;
    this.listProductsUseCase = Container.get('IListProductsUseCase') as IListProductsUseCase;
  }

  @Get('/')
  @OpenAPI({ summary: 'List all products' })
  async listProducts(
    @QueryParam('search') search: string,
    @QueryParam('categoryId') categoryId: string,
    @QueryParam('skinType') skinType: string,
    @Res() res: Response
  ): Promise<Response> {
    const result = await this.listProductsUseCase.execute({ search, categoryId, skinType });
    return this.handleResultAsJson(result, res);
  }

  @Get('/:id')
  @OpenAPI({ summary: 'Get product by ID' })
  async getProduct(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    const result = await this.getProductUseCase.execute({ id });
    return this.handleResultAsJson(result, res);
  }

  @Post('/')
  @OpenAPI({ summary: 'Create a new product' })
  async createProduct(@Body() dto: CreateProductDto, @Res() res: Response): Promise<Response> {
    const result = await this.createProductUseCase.execute(dto);
    return this.handleResultAsJson(result, res);
  }
}