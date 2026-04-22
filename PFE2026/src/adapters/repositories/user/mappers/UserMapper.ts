import { User } from '../../../../core/entities/User.js';
import { IMapper } from '../../../../core/repositories/IMapper.js';
import { user } from '../../../../infrastructure/db/schema/index.js';
type UserDB = typeof user.$inferSelect;
export class UserMapper implements IMapper<User, UserDB> {
    toDomain(db: UserDB): User {
        return new User(
            db.id,
            db.name,
            db.email,
            db.emailVerified,
            db.image,
            db.role,
            db.createdAt,
            db.updatedAt,
            db.skinType,
            db.hairType,
            db.skinConcerns,
            db.discoverySource,
            db.onboardingDone,
        );
    }
    fromDomain(domain: User): UserDB {
        return {
            id: domain.id,
            name: domain.name,
            email: domain.email,
            emailVerified: domain.emailVerified,
            image: domain.image,
            role: domain.role,
            skinType: domain.skinType,
            hairType: domain.hairType,
            skinConcerns: domain.skinConcerns,
            discoverySource: domain.discoverySource,
            onboardingDone: domain.onboardingDone,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }
}