import { v4 as uuidv4 } from 'uuid';

export enum ReportTargetType {
  USER = 'user',
  OFFER = 'offer',
}

export class Report {
  constructor(
    public readonly id: string,
    public readonly reporterUserId: string,
    public readonly targetType: ReportTargetType,
    public readonly targetId: string,
    public readonly data: any,
    public readonly createdAt: Date,
  ) {}

  static createNew(reporterUserId: string, targetType: ReportTargetType, targetId: string, data: any = {}): Report {
    return new Report(uuidv4(), reporterUserId, targetType, targetId, data, new Date());
  }
}
