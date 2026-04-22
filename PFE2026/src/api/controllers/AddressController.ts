
import { JsonController, Get, Post, Put, Delete, Body, Param, Authorized, Res, CurrentUser } from 'routing-controllers';
import { Response } from 'express';
import { Service } from 'typedi';
import { BaseController } from './BaseController.js';
import { IAddAddressUseCase } from '../../core/usecases/address/AddAddressUseCase.js';
import { IGetAddressUseCase } from '../../core/usecases/address/GetAddressUseCase.js';
import { IListUserAddressesUseCase } from '../../core/usecases/address/ListUserAddressesUseCase.js';
import { IUpdateAddressUseCase } from '../../core/usecases/address/UpdateAddressUseCase.js';
import { IDeleteAddressUseCase } from '../../core/usecases/address/DeleteAddressUseCase.js';
import { AddAddressDto } from '../dtos/address/AddAddressDto.js';
import { UpdateAddressDto } from '../dtos/address/UpdateAddressDto.js';
import Container from '../../config/Containers/AppContainers.js';

@JsonController('/addresses')
@Service()
export class AddressController extends BaseController {
    private addAddressUseCase: IAddAddressUseCase;
    private getAddressUseCase: IGetAddressUseCase;
    private listUserAddressesUseCase: IListUserAddressesUseCase;
    private updateAddressUseCase: IUpdateAddressUseCase;
    private deleteAddressUseCase: IDeleteAddressUseCase;

    constructor() {
        super();
        this.addAddressUseCase = Container.get('IAddAddressUseCase') as IAddAddressUseCase;
        this.getAddressUseCase = Container.get('IGetAddressUseCase') as IGetAddressUseCase;
        this.listUserAddressesUseCase = Container.get('IListUserAddressesUseCase') as IListUserAddressesUseCase;
        this.updateAddressUseCase = Container.get('IUpdateAddressUseCase') as IUpdateAddressUseCase;
        this.deleteAddressUseCase = Container.get('IDeleteAddressUseCase') as IDeleteAddressUseCase;
    }

    @Post('/')
    @Authorized()
    async add(@Body() dto: AddAddressDto, @CurrentUser() user: { id: string }, @Res() res: Response) {
        const result = await this.addAddressUseCase.execute({ ...dto, userId: user.id });
        return this.handleResultAsJson(result, res);
    }

    @Get('/')
    @Authorized()
    async list(@CurrentUser() user: { id: string }, @Res() res: Response) {
        const result = await this.listUserAddressesUseCase.execute(user.id);
        return this.handleResultAsJson(result, res);
    }

    @Get('/:id')
    @Authorized()
    async get(@Param('id') id: string, @CurrentUser() user: { id: string }, @Res() res: Response) {
        const result = await this.getAddressUseCase.execute(id);
        if (result.success && result.data && result.data.userId !== user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        return this.handleResultAsJson(result, res);
    }

    @Put('/:id')
    @Authorized()
    async update(@Param('id') id: string, @Body() dto: UpdateAddressDto, @CurrentUser() user: { id: string }, @Res() res: Response) {
        const result = await this.updateAddressUseCase.execute({ ...dto, id, userId: user.id });
        return this.handleResultAsJson(result, res);
    }

    @Delete('/:id')
    @Authorized()
    async delete(@Param('id') id: string, @CurrentUser() user: { id: string }, @Res() res: Response) {
        const result = await this.deleteAddressUseCase.execute(id, user.id);
        return this.handleResultAsJson(result, res);
    }
}