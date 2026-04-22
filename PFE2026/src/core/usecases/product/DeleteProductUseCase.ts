import { Service, Inject } from 'typedi';
import { IProductRepository } from '../../repositories/IProductRepository.js';

export interface IDeleteProductUseCase {
  execute(id: string): Promise<any>;
}

@Service()
export class DeleteProductUseCase implements IDeleteProductUseCase {
  constructor(@Inject('IProductRepository') private repo: IProductRepository) {}
  async execute(id: string): Promise<any> {
    await this.repo.delete(id);
    return { success: true };
  }
}
