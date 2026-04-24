import { Inject, Service } from 'typedi';
import { IReportRepository } from '../../../core/repositories/IReportRepository.js';
import { Report } from '../../../core/entities/Report.js';
import { db } from '../../../infrastructure/db/index.js';
import { report as reportTable } from '../../../infrastructure/db/schema/index.js';
import { ReportMapper } from './mappers/ReportMapper.js';

export type DbReport = typeof reportTable.$inferSelect;

@Service()
export class ReportRepository implements IReportRepository {

  @Inject(() => ReportMapper)
  private readonly mapper!: ReportMapper;

  async create(rep: Report): Promise<Report> {
    const [created] = await db.insert(reportTable).values({
      id: rep.id,
      reporterUserId: rep.reporterUserId,
      targetType: rep.targetType,
      targetId: rep.targetId,
      data: rep.data,
      createdAt: rep.createdAt,
    }).returning();

    return this.mapper.toDomain(created);

  }
}
