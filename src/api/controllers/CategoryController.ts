// import { JsonController, Get, Post, Put, Delete, Body, Param, Authorized, Res } from 'routing-controllers';
// import { Response } from 'express';
// import { Inject, Service } from 'typedi';
// import { BaseController } from './BaseController.js';
// import { ICreateCategoryUseCase } from '../../core/usecases/category/CreateCategoryUseCase.js';
// import { IGetCategoryUseCase } from '../../core/usecases/category/GetCategoryUseCase.js';
// import { IListCategoriesUseCase } from '../../core/usecases/category/ListCategoriesUseCase.js';
// import { IGetCategoryTreeUseCase } from '../../core/usecases/category/GetCategoryTreeUseCase.js';
// import { IUpdateCategoryUseCase } from '../../core/usecases/category/UpdateCategoryUseCase.js';
// import { IDeleteCategoryUseCase } from '../../core/usecases/category/DeleteCategoryUseCase.js';
// import { CreateCategoryDto } from '../dtos/category/CreateCategoryDto.js';
// import { UpdateCategoryDto } from '../dtos/category/UpdateCategoryDto.js';

// @JsonController('/categories')
// @Service()
// export class CategoryController extends BaseController {
//     constructor(
//         @Inject('ICreateCategoryUseCase') private createCategoryUseCase: ICreateCategoryUseCase,
//         @Inject('IGetCategoryUseCase') private getCategoryUseCase: IGetCategoryUseCase,
//         @Inject('IListCategoriesUseCase') private listCategoriesUseCase: IListCategoriesUseCase,
//         @Inject('IGetCategoryTreeUseCase') private getCategoryTreeUseCase: IGetCategoryTreeUseCase,
//         @Inject('IUpdateCategoryUseCase') private updateCategoryUseCase: IUpdateCategoryUseCase,
//         @Inject('IDeleteCategoryUseCase') private deleteCategoryUseCase: IDeleteCategoryUseCase
//     ) {
//         super();
//     }

//     @Post('/')
//     @Authorized() // Admin only ideally
//     async create(@Body() dto: CreateCategoryDto, @Res() res: Response) {
//         const result = await this.createCategoryUseCase.execute(dto);
//         return this.handleResultAsJson(result, res);
//     }

//     @Get('/')
//     async list(@Res() res: Response) {
//         const result = await this.listCategoriesUseCase.execute();
//         return this.handleResultAsJson(result, res);
//     }

//     @Get('/tree')
//     async getTree(@Res() res: Response) {
//         const result = await this.getCategoryTreeUseCase.execute();
//         return this.handleResultAsJson(result, res);
//     }

//     @Get('/:id')
//     async getById(@Param('id') id: string, @Res() res: Response) {
//         const result = await this.getCategoryUseCase.execute(id);
//         return this.handleResultAsJson(result, res);
//     }

//     @Put('/:id')
//     @Authorized() // Admin only
//     async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @Res() res: Response) {
//         const result = await this.updateCategoryUseCase.execute({ id, ...dto });
//         return this.handleResultAsJson(result, res);
//     }

//     @Delete('/:id')
//     @Authorized() // Admin only
//     async delete(@Param('id') id: string, @Res() res: Response) {
//         const result = await this.deleteCategoryUseCase.execute(id);
//         return this.handleResultAsJson(result, res);
//     }
// }
import { JsonController, Get, Post, Put, Delete, Body, Param, Authorized, Res } from 'routing-controllers';
import { Response } from 'express';
import { Service } from 'typedi';
import { BaseController } from './BaseController.js';
import { ICreateCategoryUseCase } from '../../core/usecases/category/CreateCategoryUseCase.js';
import { IGetCategoryUseCase } from '../../core/usecases/category/GetCategoryUseCase.js';
import { IListCategoriesUseCase } from '../../core/usecases/category/ListCategoriesUseCase.js';
import { IGetCategoryTreeUseCase } from '../../core/usecases/category/GetCategoryTreeUseCase.js';
import { IUpdateCategoryUseCase } from '../../core/usecases/category/UpdateCategoryUseCase.js';
import { IDeleteCategoryUseCase } from '../../core/usecases/category/DeleteCategoryUseCase.js';
import { CreateCategoryDto } from '../dtos/category/CreateCategoryDto.js';
import { UpdateCategoryDto } from '../dtos/category/UpdateCategoryDto.js';
import Container from '../../config/Containers/AppContainers.js';

@JsonController('/categories')
@Service()
export class CategoryController extends BaseController {
  private createCategoryUseCase: ICreateCategoryUseCase;
  private getCategoryUseCase: IGetCategoryUseCase;
  private listCategoriesUseCase: IListCategoriesUseCase;
  private getCategoryTreeUseCase: IGetCategoryTreeUseCase;
  private updateCategoryUseCase: IUpdateCategoryUseCase;
  private deleteCategoryUseCase: IDeleteCategoryUseCase;

  constructor() {
    super();
    this.createCategoryUseCase = Container.get('ICreateCategoryUseCase') as ICreateCategoryUseCase;
    this.getCategoryUseCase = Container.get('IGetCategoryUseCase') as IGetCategoryUseCase;
    this.listCategoriesUseCase = Container.get('IListCategoriesUseCase') as IListCategoriesUseCase;
    this.getCategoryTreeUseCase = Container.get('IGetCategoryTreeUseCase') as IGetCategoryTreeUseCase;
    this.updateCategoryUseCase = Container.get('IUpdateCategoryUseCase') as IUpdateCategoryUseCase;
    this.deleteCategoryUseCase = Container.get('IDeleteCategoryUseCase') as IDeleteCategoryUseCase;
  }

  @Post('/')
  @Authorized()
  async create(@Body() dto: CreateCategoryDto, @Res() res: Response) {
    const result = await this.createCategoryUseCase.execute(dto);
    return this.handleResultAsJson(result, res);
  }

  @Get('/')
  async list(@Res() res: Response) {
    const result = await this.listCategoriesUseCase.execute();
    return this.handleResultAsJson(result, res);
  }

  @Get('/tree')
  async getTree(@Res() res: Response) {
    const result = await this.getCategoryTreeUseCase.execute();
    return this.handleResultAsJson(result, res);
  }

  @Get('/:id')
  async getById(@Param('id') id: string, @Res() res: Response) {
    const result = await this.getCategoryUseCase.execute(id);
    return this.handleResultAsJson(result, res);
  }

  @Put('/:id')
  @Authorized()
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @Res() res: Response) {
    const result = await this.updateCategoryUseCase.execute({ id, ...dto });
    return this.handleResultAsJson(result, res);
  }

  @Delete('/:id')
  @Authorized()
  async delete(@Param('id') id: string, @Res() res: Response) {
    const result = await this.deleteCategoryUseCase.execute(id);
    return this.handleResultAsJson(result, res);
  }
}