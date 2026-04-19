import { Inject, Service } from 'typedi';
import { IReportRepository } from '../../repositories/IReportRepository.js';
import { Report, ReportTargetType } from '../../entities/Report.js';
import { ErrorCode, Result, ResultHelper } from '../../common/Result.js';
import { IUseCase } from '../IUseCase.js';

export interface CreateReportRequest {
  reporterUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  data?: any;
}

@Service()
export class CreateReportUseCase implements IUseCase<CreateReportRequest, Result<Report>> {
  constructor(
    @Inject('IReportRepository') private readonly repo: IReportRepository,
  ) {}

  async execute(req: CreateReportRequest): Promise<Result<Report>> {
    const report = Report.createNew(
      req.reporterUserId,
      req.targetType,
      req.targetId,
      req.data ?? {},
    );
    const result = await this.repo.create(report);
    return ResultHelper.success(result);
  }
}
