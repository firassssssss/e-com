// import {
//   JsonController,
//   Get,
//   Put,
//   Delete,
//   Param,
//   Body,
//   Authorized,
//   CurrentUser,
//   HttpCode,
//   NotFoundError,
//   Res,
// } from 'routing-controllers';
// import { Service } from 'typedi';
// import { UpdateProfileDto } from '../dtos/UpdateProfileDto.js';
// import { GetMeUseCase } from '../../core/usecases/user/GetMeUseCase.js';
// import { GetPublicProfileUseCase } from '../../core/usecases/user/GetPublicProfileUseCase.js';
// import { UpdateProfileUseCase } from '../../core/usecases/user/UpdateProfileUseCase.js';
// import { DeleteAccountUseCase } from '../../core/usecases/user/DeleteAccountUseCase.js';
// import { OpenAPI } from 'routing-controllers-openapi';
// import { User } from '../../core/entities/User.js';
// import { BaseController } from './BaseController.js';
// import { Response } from 'express';

// @Service()
// @JsonController('/v1/users')
// export class UserController extends BaseController {
//   constructor(
//     private readonly getMeUseCase: GetMeUseCase,
//     private readonly getPublicProfileUseCase: GetPublicProfileUseCase,
//     private readonly updateProfileUseCase: UpdateProfileUseCase,
//     private readonly deleteAccountUseCase: DeleteAccountUseCase,
//   ) {
//     super();
//   }

//   // GET /v1/users/me
//   @Authorized()
//   @Get('/me')
//   @OpenAPI({
//     security: [{ bearerAuth: [] }],
//   })
//   async getMe(@CurrentUser() current: any, @Res() res: Response) {
//     const user = await this.getMeUseCase.execute({ userId: current.id });
//     return this.handleResultAsJson(user, res);
//   }

//   // GET /v1/users/:id (public profile)
//   @Authorized()
//   @Get('/:id')
//   @OpenAPI({ security: [{ bearerAuth: [] }] })
//   async getPublic(@CurrentUser() current: User, @Param('id') id: string, @Res() res: Response) {
//     const profile = await this.getPublicProfileUseCase.execute({ userId: current.id, requestedUserId: id });
//     return this.handleResultAsJson(profile, res);
//   }

//   // PUT /v1/users/me
//   @Authorized()
//   @Put('/me')
//   @OpenAPI({
//     security: [{ bearerAuth: [] }],
//   })
//   async updateMe(@CurrentUser() current: any, @Body() dto: UpdateProfileDto, @Res() res: Response) {
//     const updated = await this.updateProfileUseCase.execute({ userId: current.id, data: dto });
//     return this.handleResultAsJson(updated, res);
//   }


//   // DELETE /v1/users/me
//   @Authorized()
//   @Delete('/me')
//   @HttpCode(204)
//   @OpenAPI({
//     security: [{ bearerAuth: [] }],
//   })
//   async deleteMe(@CurrentUser() current: any, @Res() res: Response) {
//     const result = await this.deleteAccountUseCase.execute({ userId: current.id });
//     return this.handleResultAsJson(result, res);
//   }
// }
import { JsonController, Get, Put, Delete, Param, Body, Authorized, CurrentUser, HttpCode, Res } from 'routing-controllers';
import { Response } from 'express';
import { Service } from 'typedi';
import { UpdateProfileDto } from '../dtos/UpdateProfileDto.js';
import { GetMeUseCase } from '../../core/usecases/user/GetMeUseCase.js';
import { GetPublicProfileUseCase } from '../../core/usecases/user/GetPublicProfileUseCase.js';
import { UpdateProfileUseCase } from '../../core/usecases/user/UpdateProfileUseCase.js';
import { DeleteAccountUseCase } from '../../core/usecases/user/DeleteAccountUseCase.js';
import { User } from '../../core/entities/User.js';
import { BaseController } from './BaseController.js';
import Container from '../../config/Containers/AppContainers.js';

@Service()
@JsonController('/v1/users')
export class UserController extends BaseController {
  private getMeUseCase: GetMeUseCase;
  private getPublicProfileUseCase: GetPublicProfileUseCase;
  private updateProfileUseCase: UpdateProfileUseCase;
  private deleteAccountUseCase: DeleteAccountUseCase;

  constructor() {
    super();
    this.getMeUseCase = Container.get('IGetMeUseCase') as GetMeUseCase;
    this.getPublicProfileUseCase = Container.get('IGetPublicProfileUseCase') as GetPublicProfileUseCase;
    this.updateProfileUseCase = Container.get('IUpdateProfileUseCase') as UpdateProfileUseCase;
    this.deleteAccountUseCase = Container.get('IDeleteAccountUseCase') as DeleteAccountUseCase;
  }

  @Authorized()
  @Get('/me')
  async getMe(@CurrentUser() current: any, @Res() res: Response) {
    const user = await this.getMeUseCase.execute({ userId: current.id });
    return this.handleResultAsJson(user, res);
  }

  @Authorized()
  @Get('/:id')
  async getPublic(@CurrentUser() current: User, @Param('id') id: string, @Res() res: Response) {
    const profile = await this.getPublicProfileUseCase.execute({ userId: current.id, requestedUserId: id });
    return this.handleResultAsJson(profile, res);
  }

  @Authorized()
  @Put('/me')
  async updateMe(@CurrentUser() current: any, @Body() dto: UpdateProfileDto, @Res() res: Response) {
    const updated = await this.updateProfileUseCase.execute({ userId: current.id, data: dto });
    return this.handleResultAsJson(updated, res);
  }

  @Authorized()
  @Delete('/me')
  @HttpCode(204)
  async deleteMe(@CurrentUser() current: any, @Res() res: Response) {
    const result = await this.deleteAccountUseCase.execute({ userId: current.id });
    return this.handleResultAsJson(result, res);
  }
}