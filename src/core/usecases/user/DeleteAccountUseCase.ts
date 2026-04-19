import { Inject, Service } from 'typedi';
import { IUseCase } from '../IUseCase.js';
import { IUserRepository } from '../../repositories/IUserRepository.js';
import { Result, ResultHelper, ErrorCode } from '../../common/Result.js';

export interface DeleteAccountRequest {
  userId: string;
}

export interface DeleteAccountResponse {
  success: boolean;
}

@Service()
export class DeleteAccountUseCase implements IUseCase<DeleteAccountRequest, Result<DeleteAccountResponse>> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) { }

  async execute(request: DeleteAccountRequest): Promise<Result<DeleteAccountResponse>> {
    try {
      // Delete user (sessions are cascade deleted via better-auth schema)
      await this.userRepository.delete(request.userId);
      return ResultHelper.success({ success: true });
    } catch (error) {
      return ResultHelper.failure('Failed to delete account', ErrorCode.INTERNAL_ERROR);
    }
  }
}
