import { JsonController, Post, Body, Authorized, CurrentUser, Res } from 'routing-controllers';
import { Response } from 'express';
import { Service } from 'typedi';
import { BaseController } from './BaseController.js';
import { TrackSignalUseCase, SignalType } from '../../core/usecases/product/TrackSignalUseCase.js';

class TrackSignalDto {
  type!: SignalType;
  productId?: string;
  searchQuery?: string;
}

@Service()
@JsonController('/v1/signals')
export class SignalController extends BaseController {
  private useCase: TrackSignalUseCase;
  constructor() {
    super();
    this.useCase = new TrackSignalUseCase();
  }

  @Authorized()
  @Post('/')
  async track(@CurrentUser() current: any, @Body() dto: TrackSignalDto, @Res() res: Response) {
    const result = await this.useCase.execute({ userId: current.id, ...dto });
    return res.json(result);
  }
}