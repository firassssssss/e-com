import { Report } from '../entities/Report.js';

export interface IReportRepository {
  create(report: Report): Promise<Report>;
}
