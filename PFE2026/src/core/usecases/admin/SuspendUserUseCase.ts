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

  async execute(userId: string): Promise<boolean> {
    // Add a suspended flag or delete; for now we'll delete the user.
    await this.userRepository.delete(userId);
    return true;
  }
}
