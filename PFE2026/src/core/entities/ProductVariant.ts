export interface VariantAttributes {
    size?: string;
    color?: string;
    scent?: string;
    formulation?: string;
    [key: string]: string | undefined; // Allow flexibility
}

export class ProductVariant {
    constructor(
        public readonly id: string,
        public productId: string,
        public sku: string,
        public name: string,
        public attributes: VariantAttributes,
        public price: number,
        public compareAtPrice: number | null,
        public stock: number,
        public lowStockThreshold: number = 10,
        public images: string[] = [],
        public isActive: boolean = true,
        public isDefault: boolean = false,
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date()
    ) { }

    isLowStock(): boolean {
        return this.stock <= this.lowStockThreshold && this.stock > 0;
    }

    isOutOfStock(): boolean {
        return this.stock <= 0;
    }

    hasDiscount(): boolean {
        return this.compareAtPrice !== null && this.compareAtPrice > this.price;
    }

    getDiscountPercentage(): number | null {
        if (!this.hasDiscount() || !this.compareAtPrice) return null;
        return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
    }
}
