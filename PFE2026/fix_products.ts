import { db } from "./src/infrastructure/db/index.js";
import { products } from "./src/infrastructure/db/schema/products.js";
import { eq } from "drizzle-orm";

const HAIR_FIXES: Record<string, string[]> = {
  "LM-SHP-001": ["hair:dry"],
  "LM-SHP-002": ["hair:oily"],
  "LM-SHP-003": ["hair:curly"],
  "LM-SHP-004": ["hair:fine"],
  "LM-CON-001": ["hair:dry"],
  "LM-CON-002": ["hair:curly"],
  "LM-HMK-001": ["hair:dry"],
  "LM-HMK-002": ["hair:oily"],
  "LM-HSR-001": ["hair:dry", "hair:curly"],
  "LM-SCP-001": ["hair:oily", "hair:dry"],
  "SDS-SHA-NIG-001": ["hair:dry", "hair:normal"],
  "NID-SHA-001":     ["hair:dry"],
  "AZU-HCA-001":     ["hair:dry", "hair:normal"],
  "NID-MSK-CAP-001": ["hair:dry", "hair:normal"],
};

const SKIN_FIXES: Record<string, string[]> = {
  "NID-GOM-001":    ["normal", "dry", "oily", "combination"],
  "AZU-ARG-001":    ["dry", "sensitive", "normal"],
  "AZU-EAU-001":    ["sensitive", "dry", "normal"],
  "HAN-KES-001":    ["normal", "oily", "combination"],
  "HAN-BEL-001":    ["oily", "combination", "normal"],
  "FDT-CRM-MNS-001":["dry", "sensitive", "normal"],
  "FDT-HES-NER-001":["sensitive", "normal", "dry"],
  "SDS-BAU-001":    ["sensitive", "dry", "normal"],
  "SDS-SOL-30-001": ["normal", "dry", "oily", "combination"],
  "AZU-CRM-AGE-001":["dry", "normal"],
};

async function main() {
  let updated = 0;

  console.log("\n── Fixing hair product skinTypes ──");
  for (const [sku, skinTypes] of Object.entries(HAIR_FIXES)) {
    const result = await db.update(products)
      .set({ skinType: skinTypes, updatedAt: new Date() })
      .where(eq(products.sku, sku))
      .returning({ id: products.id, name: products.name });
    if (result.length) { console.log(`  OK ${sku} -> ${JSON.stringify(skinTypes)}`); updated++; }
    else console.log(`  MISS ${sku}`);
  }

  console.log("\n── Fixing null skinTypes on old products ──");
  for (const [sku, skinTypes] of Object.entries(SKIN_FIXES)) {
    const result = await db.update(products)
      .set({ skinType: skinTypes, updatedAt: new Date() })
      .where(eq(products.sku, sku))
      .returning({ id: products.id, name: products.name });
    if (result.length) { console.log(`  OK ${sku} -> ${JSON.stringify(skinTypes)}`); updated++; }
    else console.log(`  MISS ${sku}`);
  }

  console.log("\n── Adding capillair keyword to hair product descriptions ──");
  const hairSkus = Object.keys(HAIR_FIXES);
  const all = await db.select({ id: products.id, sku: products.sku, description: products.description }).from(products);
  for (const p of all) {
    if (!hairSkus.includes(p.sku)) continue;
    if (p.description.toLowerCase().includes("capillair")) continue;
    await db.update(products)
      .set({ description: p.description + " Traitement capillair recommande.", updatedAt: new Date() })
      .where(eq(products.id, p.id));
    console.log(`  OK added capillair to ${p.sku}`);
  }

  console.log(`\nDone - ${updated} products updated.`);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
