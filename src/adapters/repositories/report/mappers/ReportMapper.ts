import { Report, ReportTargetType } from '../../../../core/entities/Report.js';
import { IMapper } from '../../../../core/repositories/IMapper.js';
import { Service } from "typedi";
import { DbReport } from '../ReportRepository.js';

@Service()
export class ReportMapper implements IMapper<Report, DbReport> {
    toDomain(db: DbReport): Report {
        return new Report(
            db.id,
            db.reporterUserId,
            db.targetType as ReportTargetType,
            db.targetId,
            db.data,
            db.createdAt,
        );
    }
    fromDomain(domain: Report): DbReport {
        return {
            id: domain.id,
            reporterUserId: domain.reporterUserId,
            targetType: domain.targetType,
            targetId: domain.targetId,
            data: domain.data,
            createdAt: domain.createdAt,
        };
    }

}
