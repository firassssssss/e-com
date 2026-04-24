import { db } from "./src/infrastructure/db/index.js";
import { products } from "./src/infrastructure/db/schema/products.js";
import { categories } from "./src/infrastructure/db/schema/categories.js";
import { productVariants } from "./src/infrastructure/db/schema/productVariants.js";

async function main() {
  const cats = await db.select().from(categories);
  const prods = await db.select().from(products);
  const vars = await db.select().from(productVariants);
  console.log("=== CATEGORIES ===", cats.length);
  cats.forEach(c => console.log(` [${c.parentId ? "sub" : "ROOT"}] ${c.name} (${c.slug})`));
  console.log("\n=== PRODUCTS ===", prods.length);
  prods.forEach(p => console.log(` ${p.sku} | ${p.name} | TND ${p.price} | skins: ${JSON.stringify(p.skinType)}`));
  console.log("\n=== VARIANTS ===", vars.length);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
