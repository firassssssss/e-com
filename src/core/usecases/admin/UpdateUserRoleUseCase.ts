import { Service, Inject } from 'typedi';
import { IUserRepository } from '../../repositories/IUserRepository.js';
import { UserRole } from '../../types/UserRole.js';

export interface IUpdateUserRoleUseCase {
  execute(userId: string, newRole: UserRole): Promise<boolean>;
}

@Service()
export class UpdateUserRoleUseCase implements IUpdateUserRoleUseCase {
  constructor(
    @Inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  async execute(userId: string, newRole: UserRole): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user) return false;
    await this.userRepository.updatePartial(userId, { role: newRole });
    return true;
  }
}
