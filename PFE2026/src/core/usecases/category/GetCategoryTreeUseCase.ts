import { Service, Inject } from 'typedi';
import { Result, ResultHelper } from '../../common/Result.js';
import { Category } from '../../entities/Category.js';
import { ICategoryRepository } from '../../repositories/ICategoryRepository.js';

export interface CategoryNode extends Category {
    children: CategoryNode[];
}

export interface IGetCategoryTreeUseCase {
    execute(): Promise<Result<CategoryNode[]>>;
}

@Service()
export class GetCategoryTreeUseCase implements IGetCategoryTreeUseCase {
    constructor(
        @Inject('ICategoryRepository') private categoryRepository: ICategoryRepository
    ) { }

    async execute(): Promise<Result<CategoryNode[]>> {
        const allCategories = await this.categoryRepository.findAll();
        const tree = this.buildTree(allCategories);
        return ResultHelper.success(tree);
    }

    private buildTree(categories: Category[]): CategoryNode[] {
        const categoryMap = new Map<string, CategoryNode>();
        const roots: CategoryNode[] = [];

        // Initialize nodes
        categories.forEach(cat => {
            // Cast to any to bypass strict class method requirements for the response object
            const node = { ...cat, children: [] } as any as CategoryNode;
            categoryMap.set(cat.id, node);
        });

        // Build hierarchy
        categories.forEach(cat => {
            const node = categoryMap.get(cat.id)!;
            if (cat.parentId) {
                const parent = categoryMap.get(cat.parentId);
                if (parent) {
                    parent.children.push(node);
                } else {
                    // Parent not found (maybe inactive/deleted?), treat as root or orphan
                    // For now, let's treat as root or log warning
                    roots.push(node);
                }
            } else {
                roots.push(node);
            }
        });

        return roots;
    }
}
