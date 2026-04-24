import { Service, Inject } from 'typedi';
import { IProductRepository } from '../../repositories/IProductRepository.js';

export interface IUpdateProductUseCase {
  execute(data: any): Promise<any>;
}

@Service()
export class UpdateProductUseCase implements IUpdateProductUseCase {
  constructor(@Inject('IProductRepository') private repo: IProductRepository) {}
  async execute(data: any): Promise<any> {
    // TODO: implement update logic
    return { success: true };
  }
}
