import { db } from "./src/infrastructure/db/index.js";
import { products } from "./src/infrastructure/db/schema/products.js";
import { eq } from "drizzle-orm";

const FIXES: Record<string, { name: string; brand: string; description: string; skinType: string[] }> = {

  // ── Old Tunisian products → rebrand + proper English description ──────────
  "GAM-SAV-001": {
    name: "Lumina Natural Goat Milk Soap",
    brand: "Lumina",
    description: "Artisanal Tunisian soap with fresh goat milk. Ultra-gentle formula that cleanses and soothes sensitive and dry skin. Rich in lactic acid for natural mild exfoliation and deep nourishment. Fragrance-free and hypoallergenic. Ideal for reactive and sensitive skin prone to redness.",
    skinType: ["sensitive", "dry", "normal"],
  },
  "NID-LOT-001": {
    name: "Lumina Olive Oil Body Lotion",
    brand: "Lumina",
    description: "Lightweight body lotion with pure Tunisian olive oil. Hydrates and nourishes dry and normal skin with antioxidants and essential fatty acids. Absorbs quickly without greasiness leaving skin soft and smooth all day.",
    skinType: ["normal", "dry"],
  },
  "GAM-HYD-001": {
    name: "Lumina Argan Hydrating Face Cream",
    brand: "Lumina",
    description: "Rich face moisturizer with pure Tunisian argan oil. Intensely hydrates and nourishes dry and dehydrated skin. Restores suppleness, reduces fine lines, and boosts radiance. Vitamin E antioxidant protection against environmental damage.",
    skinType: ["dry", "normal"],
  },
  "GAM-SER-001": {
    name: "Lumina Prickly Pear Anti-Age Serum",
    brand: "Lumina",
    description: "Luxurious anti-aging face serum with prickly pear cactus seed oil from Tunisia. Rich in vitamin E and omega fatty acids. Deeply nourishes dry and mature skin, visibly reduces wrinkles and fine lines, and restores skin firmness and radiance.",
    skinType: ["dry", "normal"],
  },
  "NID-SOL-001": {
    name: "Lumina SPF50 Face Sunscreen",
    brand: "Lumina",
    description: "High-performance SPF50 broad-spectrum UVA UVB face sunscreen. Lightweight non-greasy formula ideal for oily and combination skin. Controls shine, prevents sun damage, and leaves no white cast. Suitable for daily use under makeup.",
    skinType: ["oily", "combination", "normal"],
  },
  "AZU-SER-VIT-001": {
    name: "Lumina Vitamin C Radiance Serum",
    brand: "Lumina",
    description: "Concentrated vitamin C brightening serum that illuminates dull skin and evens skin tone. Reduces dark spots, hyperpigmentation, and post-blemish marks for a radiant luminous complexion. Antioxidant-rich formula suitable for all skin types.",
    skinType: ["normal", "combination", "oily", "dry"],
  },
  "HAN-RHA-001": {
    name: "Lumina Rhassoul Purifying Clay Mask",
    brand: "Lumina",
    description: "Natural purifying rhassoul clay powder for face and oily hair. Absorbs excess sebum, deeply cleanses pores, and removes impurities. Mix with rose water for a purifying face mask or scalp treatment. Controls shine and minimises pores for oily and combination skin.",
    skinType: ["oily", "combination"],
  },
  "FDT-TON-001": {
    name: "Lumina Chamomile Soothing Toner",
    brand: "Lumina",
    description: "Gentle alcohol-free toner with Tunisian chamomile. Calms redness, soothes sensitive and reactive skin, and balances pH. Anti-inflammatory and hydrating formula. Perfect for sensitive dry and redness-prone skin.",
    skinType: ["sensitive", "dry", "normal"],
  },
  "SDS-LOT-CIT-001": {
    name: "Lumina Lemon Purifying Toner",
    brand: "Lumina",
    description: "Purifying toning lotion with Tunisian lemon extract for oily and acne-prone skin. Controls excess sebum, minimises enlarged pores, and fights acne-causing bacteria. Brightens and clarifies skin tone for a matte clear complexion.",
    skinType: ["oily", "combination"],
  },
  "NID-GOM-001": {
    name: "Lumina Sea Salt Body Scrub",
    brand: "Lumina",
    description: "Exfoliating body scrub with Tunisian sea salt and mint extract. Removes dead skin cells, stimulates circulation, and leaves skin silky smooth. Suitable for all skin types. Reveals brighter softer and more radiant skin.",
    skinType: ["normal", "dry", "oily", "combination"],
  },
  "AZU-ARG-001": {
    name: "Lumina Pure Organic Argan Oil",
    brand: "Lumina",
    description: "Cold-pressed 100% organic pure argan oil from Tunisia. Multi-purpose beauty oil for face body and hair. Deeply nourishes dry and sensitive skin, tames frizzy hair, and strengthens brittle nails. Rich in vitamin E and essential fatty acids.",
    skinType: ["dry", "sensitive", "normal"],
  },
  "AZU-HCA-001": {
    name: "Lumina Black Seed & Argan Hair Oil",
    brand: "Lumina",
    description: "Nourishing capillair oil combining Tunisian black seed nigelle oil and pure argan oil. Strengthens dry and brittle hair, reduces frizz, and restores brilliant shine. Promotes healthy hair growth and soothes dry irritated scalp. Capillair treatment for damaged hair.",
    skinType: ["hair:dry", "hair:normal"],
  },
  "NID-MSK-CAP-001": {
    name: "Lumina Strengthening Hair Mask",
    brand: "Lumina",
    description: "Intensive fortifying capillair hair mask for weakened dry and fragile hair. Deeply nourishes and repairs damaged hair fibres with argan oil and keratin proteins. Reduces breakage, restores elasticity, and adds brilliant shine. Weekly capillair treatment for all hair types.",
    skinType: ["hair:dry", "hair:normal"],
  },
  "AZU-EAU-001": {
    name: "Lumina Gammarth Pure Rose Water",
    brand: "Lumina",
    description: "100% natural rose water distilled from Gammarth roses in Tunisia. Alcohol-free facial toner that soothes sensitive and dry skin, reduces redness, and hydrates. Use as a toner, facial mist, or makeup setter. Calming and anti-inflammatory for reactive skin.",
    skinType: ["sensitive", "dry", "normal"],
  },
  "HAN-KES-001": {
    name: "Lumina Traditional Kessa Exfoliating Glove",
    brand: "Lumina",
    description: "Traditional Tunisian kessa glove for body exfoliation in the hammam style. Removes dead skin cells, stimulates blood circulation, and reveals soft smooth skin. Use with body scrub for best results. Suitable for all skin types.",
    skinType: ["normal", "oily", "combination", "dry"],
  },
  "HAN-BEL-001": {
    name: "Lumina Beldi Soap with Ghassoul Clay",
    brand: "Lumina",
    description: "Authentic Tunisian beldi soap with ghassoul clay and olive oil. Deep-cleansing purifying formula that removes impurities and softens skin. Traditional hammam ritual soap for oily and combination skin prone to excess sebum and clogged pores.",
    skinType: ["oily", "combination", "normal"],
  },
  "FDT-CRM-MNS-001": {
    name: "Lumina Fig Repair Hand Cream",
    brand: "Lumina",
    description: "Ultra-nourishing hand cream with Tunisian fig extract. Repairs dry cracked and rough hands. Absorbs quickly without greasiness. Rich in vitamins and antioxidants for soft smooth and intensely hydrated skin.",
    skinType: ["dry", "sensitive", "normal"],
  },
  "FDT-HES-NER-001": {
    name: "Lumina Tunisian Neroli Essential Oil",
    brand: "Lumina",
    description: "100% pure Tunisian neroli essential oil extracted from Nabeul orange blossoms. Calming and regenerating for sensitive mature and dry skin. Reduces redness, evens skin tone, and promotes cell renewal. Use diluted in carrier oil.",
    skinType: ["sensitive", "normal", "dry"],
  },
  "SDS-BAU-001": {
    name: "Lumina Shea & Honey Lip Balm",
    brand: "Lumina",
    description: "Nourishing lip balm with shea butter and Tunisian honey. Deeply moisturises repairs and protects dry and chapped lips. Long-lasting hydration with natural beeswax. Soothing and healing formula for sensitive lips.",
    skinType: ["sensitive", "dry", "normal"],
  },
  "SDS-SOL-30-001": {
    name: "Lumina SPF30 Body Sunscreen",
    brand: "Lumina",
    description: "Lightweight body sunscreen SPF30 for the whole family. Broad-spectrum UVA UVB protection for daily use. Hydrating formula with glycerin and vitamin E. Non-greasy finish suitable for all skin types including sensitive and dry skin.",
    skinType: ["normal", "dry", "oily", "combination"],
  },
  "AZU-CRM-AGE-001": {
    name: "Lumina Prickly Pear Anti-Aging Cream",
    brand: "Lumina",
    description: "Anti-aging face cream with prickly pear seed oil from Tunisia. Reduces wrinkles fine lines and loss of firmness. Rich in antioxidants vitamin E and omega fatty acids. Deeply nourishes dry and normal skin for a youthful plumped complexion.",
    skinType: ["dry", "normal"],
  },
  "NID-SHA-001": {
    name: "Lumina Argan Repair Shampoo for Dry Hair",
    brand: "Lumina",
    description: "Repairing shampoo with pure argan oil for dry brittle and damaged hair. Deeply nourishes dry hair fibres reduces frizz and restores shine and softness. Sulphate-free formula safe for colour-treated hair. Capillair treatment for best results.",
    skinType: ["hair:dry"],
  },
  "SDS-SHA-NIG-001": {
    name: "Lumina Black Seed Strengthening Shampoo",
    brand: "Lumina",
    description: "Fortifying shampoo with Tunisian black seed nigelle oil that fights hair loss and strengthens dry and fragile hair. Stimulates hair growth nourishes the scalp and adds volume and shine. Capillair treatment for weakened and brittle hair.",
    skinType: ["hair:dry", "hair:normal"],
  },
  "GAM-NET-001": {
    name: "Lumina Rose Water Cleansing Gel",
    brand: "Lumina",
    description: "Gentle cleansing gel with Gammarth rose water. Removes makeup and impurities without stripping moisture. Suitable for all skin types including sensitive skin prone to redness. Leaves skin clean refreshed and hydrated.",
    skinType: ["sensitive", "normal", "dry"],
  },
  "GAM-MSK-001": {
    name: "Lumina Green Clay Purifying Mask",
    brand: "Lumina",
    description: "Purifying green clay mask for oily and combination skin. Controls excess sebum minimises pores and removes blackheads and impurities. Leaves skin clean matte and visibly clearer. Anti-acne formula with salicylic action.",
    skinType: ["oily", "combination"],
  },

  // ── Lumiere products → rebrand to Lumina ────────────────────────────────────
  "SKU-001": {
    name: "Lumina Hyaluronic Hydrating Serum",
    brand: "Lumina",
    description: "Deeply hydrating face serum with multi-weight hyaluronic acid. Plumps dehydrated skin, smooths fine lines, and restores a bouncy dewy complexion. Ideal for dry sensitive and dehydrated skin.",
    skinType: ["dry", "normal", "sensitive"],
  },
  "SKU-002": {
    name: "Lumina Brightening Vitamin C Day Cream",
    brand: "Lumina",
    description: "Brightening daily moisturizer with vitamin C that evens skin tone and fades dark spots and hyperpigmentation. Antioxidant-rich formula for radiant luminous skin. Suitable for all skin types including dull and uneven skin.",
    skinType: ["normal", "combination", "dry", "oily"],
  },
  "SKU-003": {
    name: "Lumina Gentle Foam Cleanser Classic",
    brand: "Lumina",
    description: "Sulphate-free gentle foaming cleanser for sensitive and dry skin. Removes impurities without stripping the skin barrier. Soothes redness and calms irritation with aloe vera. Fragrance-free and dermatologist-tested.",
    skinType: ["sensitive", "dry"],
  },
  "SKU-004": {
    name: "Lumina SPF50 Sunscreen Fluid",
    brand: "Lumina",
    description: "Lightweight non-greasy daily sunscreen fluid SPF50. Broad-spectrum UVA UVB protection. Matte finish that controls shine and minimises pores. Perfect for oily combination and acne-prone skin. Non-comedogenic.",
    skinType: ["oily", "combination"],
  },
  "SKU-005": {
    name: "Lumina Anti-Aging Retinol Night Cream",
    brand: "Lumina",
    description: "Rich overnight anti-aging cream with retinol and peptides. Reduces wrinkles and fine lines while you sleep. Stimulates collagen production and improves skin firmness. Best for dry and mature skin concerned with aging.",
    skinType: ["dry", "normal"],
  },
  "SKU-006": {
    name: "Lumina Pore Balancing Toner",
    brand: "Lumina",
    description: "Alcohol-free balancing toner with niacinamide that minimises enlarged pores and controls excess sebum. Ideal for oily acne-prone and combination skin. Refines skin texture and reduces shine for a clear matte complexion.",
    skinType: ["oily", "combination"],
  },
};

async function main() {
  let updated = 0;
  console.log("\n── Fixing brands and descriptions ──");
  for (const [sku, fix] of Object.entries(FIXES)) {
    const result = await db.update(products)
      .set({
        name:        fix.name,
        brand:       fix.brand,
        description: fix.description,
        skinType:    fix.skinType,
        updatedAt:   new Date(),
      })
      .where(eq(products.sku, sku))
      .returning({ id: products.id });

    if (result.length) { console.log(`  OK  ${sku} -> ${fix.name}`); updated++; }
    else                { console.log(`  MISS ${sku}`); }
  }
  console.log(`\nDone — ${updated} products fixed.`);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
