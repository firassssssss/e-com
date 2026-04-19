import { Inject, Service } from 'typedi';
import { IUserRepository } from '../../repositories/IUserRepository.js';
import { IUseCase } from '../IUseCase.js';
import { User } from '../../entities/User.js';
import { ErrorCode, Result, ResultHelper } from '../../common/Result.js';

export interface GetPublicProfileRequest {
  userId: string;
  requestedUserId?: string;
}

@Service()
export class GetPublicProfileUseCase implements IUseCase<GetPublicProfileRequest, Result<User | null>> {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: GetPublicProfileRequest): Promise<Result<User | null>> {
    const user = await this.userRepository.findById(request.userId);
    if (!user) return ResultHelper.failure('User not found', ErrorCode.NOT_FOUND);

    return ResultHelper.success(user);
  }
}
