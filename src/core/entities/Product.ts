export class Product {
    constructor(
        public readonly id: string,
        public name: string,
        public description: string,
        public price: number | null, // Nullable if variants exist
        public categoryId: string,
        public brand: string,
        public sku: string, // Master SKU or generated if variants
        public stock: number | null, // Nullable if variants exist
        public images: string[],
        public ingredients: string[] | undefined,
        public skinType: string[] | undefined,
        public isActive: boolean,
        public hasVariants: boolean = false,
        public averageRating: number = 0,
        public reviewCount: number = 0,
        public createdAt: Date,
        public updatedAt: Date
    ) { }
}
