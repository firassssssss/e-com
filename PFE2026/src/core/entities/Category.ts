export class Category {
    constructor(
        public readonly id: string,
        public name: string,
        public slug: string,
        public description: string | null,
        public parentId: string | null,
        public displayOrder: number = 0,
        public isActive: boolean = true,
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date()
    ) { }

    isRootCategory(): boolean {
        return this.parentId === null;
    }

    isSubcategory(): boolean {
        return this.parentId !== null;
    }
}
