import { db } from "./src/infrastructure/db/index.js";
import { products } from "./src/infrastructure/db/schema/products.js";

async function main() {
  const all = await db.select().from(products);
  console.log("\n=== NON-LUMINA BRANDS ===");
  all.filter(p => p.brand !== "Lumina").forEach(p =>
    console.log(`  ${p.sku} | brand="${p.brand}" | ${p.name}`)
  );
  console.log("\n=== ALL PRODUCTS WITH DESCRIPTION PREVIEW ===");
  all.forEach(p =>
    console.log(`  [${p.brand}] ${p.sku} | ${p.name}\n    >> ${p.description?.slice(0, 120)}`)
  );
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
