import { Inject, Service } from 'typedi';
import { IUserRepository } from '../../repositories/IUserRepository.js';
import { IUseCase } from '../IUseCase.js';
import { User } from '../../entities/User.js';
import { UpdateProfileDto } from '../../../api/dtos/UpdateProfileDto.js';
import { ErrorCode, Result, ResultHelper } from '../../common/Result.js';

export interface UpdateProfileRequest {
  userId: string;
  data: UpdateProfileDto;
}

@Service()
export class UpdateProfileUseCase implements IUseCase<UpdateProfileRequest, Result<User | null>> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: UpdateProfileRequest): Promise<Result<User | null>> {
    try {
      const user = await this.userRepository.updatePartial(request.userId, request.data);
      return ResultHelper.success(user);
    } catch (error) {
      return ResultHelper.failure('Failed to update profile', ErrorCode.INTERNAL_ERROR);
    }
  }
}
