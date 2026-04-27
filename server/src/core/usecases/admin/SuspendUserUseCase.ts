import { Service, Inject } from 'typedi';
import { IUserRepository } from '../../repositories/IUserRepository.js';

export interface ISuspendUserUseCase {
  execute(userId: string): Promise<boolean>;
}

@Service()
export class SuspendUserUseCase implements ISuspendUserUseCase {
  constructor(
    @Inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  /**
   * Suspends a user by setting their role to "suspended".
   * This prevents login without destroying any data.
   * A super_admin can reinstate via UpdateUserRoleUseCase.
   */
  async execute(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      console.warn(`[SuspendUserUseCase] User '${userId}' not found`);
      return false;
    }

    if (user.role === 'super_admin') {
      console.warn(`[SuspendUserUseCase] Cannot suspend super_admin '${userId}' — blocked`);
      return false;
    }

    await this.userRepository.updatePartial(userId, { role: 'suspended' });
    console.log(`[SuspendUserUseCase] User '${userId}' suspended`);
    return true;
  }
}
