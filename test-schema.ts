import { products } from './src/infrastructure/db/schema/products.js';

console.log('Products schema imported successfully:', products);
if (products) {
    console.log('Table name:', (products as any)[Symbol.for("drizzle:Name")]);
}
