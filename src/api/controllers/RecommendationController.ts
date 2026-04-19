import { JsonController, Get, Authorized, CurrentUser, Res, QueryParam } from 'routing-controllers';
import { Response } from 'express';
import { Service } from 'typedi';
import { BaseController } from './BaseController.js';
import { GetRecommendationsUseCase } from '../../core/usecases/product/GetRecommendationsUseCase.js';

@Service()
@JsonController('/v1/recommendations')
export class RecommendationController extends BaseController {
  private useCase: GetRecommendationsUseCase;

  constructor() {
    super();
    this.useCase = new GetRecommendationsUseCase();
  }

  @Authorized()
  @Get('/')
  async getRecommendations(
    @CurrentUser() current: any,
    @QueryParam('limit') limit: number = 8,
    @Res() res: Response
  ) {
    const result = await this.useCase.execute({ userId: current.id, limit });
    return res.json(result);
  }
}