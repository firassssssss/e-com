import 'reflect-metadata';
import { Container } from 'typedi';
import { db } from '../infrastructure/db/index.js';
import { user } from '../infrastructure/db/schema/auth.js';
import { CategoryRepository } from '../adapters/repositories/category/CategoryRepository.js';
import { ProductRepository } from '../adapters/repositories/product/ProductRepository.js';
import { ProductVariantRepository } from '../adapters/repositories/product/ProductVariantRepository.js';
import { ReviewRepository } from '../adapters/repositories/review/ReviewRepository.js';
import { WishlistRepository } from '../adapters/repositories/wishlist/WishlistRepository.js';
import { AddressRepository } from '../adapters/repositories/address/AddressRepository.js';
import { Category } from '../core/entities/Category.js';
import { Product } from '../core/entities/Product.js';
import { ProductVariant } from '../core/entities/ProductVariant.js';
import { Review } from '../core/entities/Review.js';
import { Wishlist } from '../core/entities/Wishlist.js';
import { Address } from '../core/entities/Address.js';
import { v4 as uuidv4 } from 'uuid';

async function verify() {
    console.log('Starting verification...');

    const categoryRepo = Container.get(CategoryRepository);
    const productRepo = Container.get(ProductRepository);
    const variantRepo = Container.get(ProductVariantRepository);
    const reviewRepo = Container.get(ReviewRepository);
    const wishlistRepo = Container.get(WishlistRepository);
    const addressRepo = Container.get(AddressRepository);

    // 1. Create Category
    console.log('1. Creating Category...');
    const categoryId = uuidv4();
    const category = new Category(categoryId, 'Electronics', 'electronics-slug', 'Best electronics', null, 0, true);
    await categoryRepo.create(category);
    console.log('Category created:', category.name);

    // 2. Create Product
    console.log('2. Creating Product...');
    const productId = uuidv4();
    const product = new Product(
        productId,
        'Smartphone',
        'Latest model',
        null, // price null as it has variants
        categoryId,
        'BrandX',
        'SMART-001',
        null, // stock null as it has variants
        ['image1.jpg'],
        undefined,
        undefined,
        true, // isActive
        true, // hasVariants
        0, // averageRating
        0, // reviewCount
        new Date(),
        new Date()
    );
    await productRepo.create(product);
    console.log('Product created:', product.name);

    // 3. Create Variant
    console.log('3. Creating Product Variant...');
    const variantId = uuidv4();
    const variant = new ProductVariant(
        variantId,
        productId,
        'BLUE-128',
        'Blue/128GB',
        { color: 'Blue', storage: '128GB' },
        999,
        null,
        10
    );
    await variantRepo.create(variant);
    console.log('Variant created:', variant.sku);

    // 4. Create Review
    console.log('4. Creating Review...');
    const userId = 'user-123'; // Mock user ID
    const reviewId = uuidv4();
    const review = new Review(reviewId, userId, productId, 5, 'Great phone!', []);
    await reviewRepo.create(review);

    // Verify stats update
    const updatedProduct = await productRepo.findById(productId);
    console.log('Review created. Product Rating:', updatedProduct?.averageRating, 'Count:', updatedProduct?.reviewCount);

    // 5. Wishlist
    console.log('5. Testing Wishlist...');
    // Ensure wishlist exists
    let wishlist = await wishlistRepo.findByUserId(userId);
    if (!wishlist) {
        wishlist = await wishlistRepo.create(new Wishlist(uuidv4(), userId));
    }
    await wishlistRepo.addItem(wishlist.id, productId);
    const updatedWishlist = await wishlistRepo.findByUserId(userId);
    console.log('Wishlist items count:', updatedWishlist?.items.length);

    // 6. Address
    console.log('6. Creating Address...');
    const addressId = uuidv4();
    const address = new Address(addressId, userId, 'John Doe', '12345678', '123 Main St', 'Tunis', 'Tunis', '1000', 'Tunisia', true);
    await addressRepo.create(address);
    console.log('Address created:', address.toString());

    console.log('Verification complete!');
    process.exit(0);
}

verify().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});
