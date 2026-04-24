
import { db } from './src/infrastructure/db/index.js';
import { categories } from './src/infrastructure/db/schema/categories.js';
import { products }   from './src/infrastructure/db/schema/products.js';
import { productVariants } from './src/infrastructure/db/schema/productVariants.js';

// ── helpers ──────────────────────────────────────────────────────────────────
const id = () => crypto.randomUUID();
const now = new Date();

// ── 1. CATEGORIES ────────────────────────────────────────────────────────────
const CAT = {
  skincare:    { id: id(), name: 'Skincare',          slug: 'skincare',         parent: null },
  haircare:    { id: id(), name: 'Haircare',          slug: 'haircare',         parent: null },
  bodycare:    { id: id(), name: 'Body Care',         slug: 'body-care',        parent: null },
  cleansers:   { id: id(), name: 'Cleansers',         slug: 'cleansers',        parent: 'skincare' },
  moisturizers:{ id: id(), name: 'Moisturizers',      slug: 'moisturizers',     parent: 'skincare' },
  serums:      { id: id(), name: 'Serums',            slug: 'serums',           parent: 'skincare' },
  masks:       { id: id(), name: 'Face Masks',        slug: 'face-masks',       parent: 'skincare' },
  toners:      { id: id(), name: 'Toners',            slug: 'toners',           parent: 'skincare' },
  suncare:     { id: id(), name: 'Sun Care',          slug: 'sun-care',         parent: 'skincare' },
  eyecare:     { id: id(), name: 'Eye Care',          slug: 'eye-care',         parent: 'skincare' },
  shampoos:    { id: id(), name: 'Shampoos',          slug: 'shampoos',         parent: 'haircare' },
  conditioners:{ id: id(), name: 'Conditioners',      slug: 'conditioners',     parent: 'haircare' },
  hairmasks:   { id: id(), name: 'Hair Masks',        slug: 'hair-masks',       parent: 'haircare' },
  hairserums:  { id: id(), name: 'Hair Serums',       slug: 'hair-serums',      parent: 'haircare' },
  scalp:       { id: id(), name: 'Scalp Care',        slug: 'scalp-care',       parent: 'haircare' },
  bodylotions: { id: id(), name: 'Body Lotions',      slug: 'body-lotions',     parent: 'bodycare' },
  bodyscrubs:  { id: id(), name: 'Body Scrubs',       slug: 'body-scrubs',      parent: 'bodycare' },
};

async function seedCategories() {
  const rows = Object.values(CAT).map((c, i) => ({
    id:           c.id,
    name:         c.name,
    slug:         c.slug,
    description:  c.name + ' products by Lumina',
    parentId:     c.parent ? CAT[c.parent as keyof typeof CAT].id : null,
    displayOrder: i,
    isActive:     true,
    createdAt:    now,
    updatedAt:    now,
  }));
  await db.insert(categories).values(rows).onConflictDoNothing();
  console.log('categories seeded:', rows.length);
}

// ── 2. PRODUCTS ──────────────────────────────────────────────────────────────
// skinType array drives content-based score in GetRecommendationsUseCase
// description carries all keyword hits for concern/hair keyword scoring

const PRODUCTS = [

  // ── CLEANSERS ──
  { sku:'LM-CLN-001', name:'Lumina Gentle Foam Cleanser',
    desc:'A soft foaming cleanser that purifies pores without stripping moisture. Ideal for sensitive and dry skin. Fragrance-free, calming formula with aloe vera and chamomile to soothe redness and irritation.',
    cat:'cleansers', price:'45.000', skins:['sensitive','dry','normal'],
    ing:['aloe vera','chamomile extract','glycerin','panthenol'],
    variants:[
      { sku:'LM-CLN-001-100', name:'100ml', attr:{ size:'100ml' }, price:'45.000', compare:'55.000', stock:80, def:true  },
      { sku:'LM-CLN-001-200', name:'200ml', attr:{ size:'200ml' }, price:'79.000', compare:'95.000', stock:50, def:false },
    ]
  },
  { sku:'LM-CLN-002', name:'Lumina Purifying Gel Cleanser',
    desc:'Deep-cleansing salicylic acid gel cleanser that unclogs pores and fights acne breakouts. Controls excess sebum on oily and combination skin. Anti-blemish formula with niacinamide for clearer, smoother skin.',
    cat:'cleansers', price:'52.000', skins:['oily','combination'],
    ing:['salicylic acid 1%','niacinamide','zinc PCA','tea tree extract'],
    variants:[
      { sku:'LM-CLN-002-150', name:'150ml', attr:{ size:'150ml' }, price:'52.000', compare:'65.000', stock:70, def:true  },
    ]
  },
  { sku:'LM-CLN-003', name:'Lumina Balancing Micellar Water',
    desc:'Gentle micellar water that removes makeup and impurities without rubbing. Hydrating and balancing for all skin types. Perfect for sensitive skin prone to redness. No rinse needed.',
    cat:'cleansers', price:'38.000', skins:['sensitive','dry','combination','normal','oily'],
    ing:['micellar technology','rose water','glycerin','vitamin E'],
    variants:[
      { sku:'LM-CLN-003-200', name:'200ml', attr:{ size:'200ml' }, price:'38.000', compare:'48.000', stock:100, def:true  },
      { sku:'LM-CLN-003-400', name:'400ml', attr:{ size:'400ml' }, price:'65.000', compare:'80.000', stock:60,  def:false },
    ]
  },

  // ── MOISTURIZERS ──
  { sku:'LM-MOI-001', name:'Lumina Hydra-Boost Day Cream',
    desc:'Lightweight hyaluronic acid moisturizer that delivers intense hydration for dry and dehydrated skin. Plumps fine lines and restores the skin barrier. Non-comedogenic, suitable for all skin types including sensitive.',
    cat:'moisturizers', price:'89.000', skins:['dry','sensitive','normal'],
    ing:['hyaluronic acid','ceramides','shea butter','vitamin B5'],
    variants:[
      { sku:'LM-MOI-001-50',  name:'50ml', attr:{ size:'50ml' }, price:'89.000', compare:'110.000', stock:60, def:true  },
      { sku:'LM-MOI-001-100', name:'100ml',attr:{ size:'100ml'},  price:'149.000',compare:'180.000', stock:40, def:false },
    ]
  },
  { sku:'LM-MOI-002', name:'Lumina Oil-Free Gel Moisturizer',
    desc:'Lightweight oil-free gel moisturizer for oily and acne-prone skin. Controls sebum and minimises pores without clogging them. Mattifying finish with niacinamide to fade dark spots and hyperpigmentation.',
    cat:'moisturizers', price:'79.000', skins:['oily','combination'],
    ing:['niacinamide 5%','zinc','hyaluronic acid','green tea extract'],
    variants:[
      { sku:'LM-MOI-002-50',  name:'50ml', attr:{ size:'50ml' }, price:'79.000', compare:'95.000', stock:75, def:true  },
    ]
  },
  { sku:'LM-MOI-003', name:'Lumina Repair Night Cream',
    desc:'Rich anti-aging night cream with retinol and collagen-boosting peptides. Reduces wrinkles and firms skin overnight. Ideal for mature, dry, and combination skin concerned with aging, fine lines, and loss of firmness.',
    cat:'moisturizers', price:'119.000', skins:['dry','normal','combination'],
    ing:['retinol 0.3%','peptides','collagen','rosehip oil','vitamin C'],
    variants:[
      { sku:'LM-MOI-003-50', name:'50ml', attr:{ size:'50ml' }, price:'119.000', compare:'145.000', stock:45, def:true  },
    ]
  },
  { sku:'LM-MOI-004', name:'Lumina Soothing Barrier Cream',
    desc:'Ultra-calming ceramide cream for sensitive and reactive skin. Repairs the skin barrier, reduces redness and soothes irritation. Fragrance-free, dermatologist-tested. Also great for rosacea-prone and dehydrated skin.',
    cat:'moisturizers', price:'95.000', skins:['sensitive','dry'],
    ing:['ceramides NP','EOP','AP','cholesterol','allantoin','centella asiatica'],
    variants:[
      { sku:'LM-MOI-004-50',  name:'50ml', attr:{ size:'50ml' }, price:'95.000', compare:'115.000', stock:55, def:true  },
      { sku:'LM-MOI-004-100', name:'100ml',attr:{ size:'100ml'}, price:'165.000',compare:'195.000', stock:30, def:false },
    ]
  },

  // ── SERUMS ──
  { sku:'LM-SER-001', name:'Lumina Vitamin C Brightening Serum',
    desc:'High-potency vitamin C serum that fades dark spots, hyperpigmentation, and post-acne marks. Boosts radiance and glow for dull skin. Antioxidant protection against environmental damage. For all skin types.',
    cat:'serums', price:'135.000', skins:['normal','combination','dry','oily'],
    ing:['vitamin C 15%','vitamin E','ferulic acid','niacinamide','kojic acid'],
    variants:[
      { sku:'LM-SER-001-30', name:'30ml', attr:{ size:'30ml' }, price:'135.000', compare:'165.000', stock:50, def:true  },
    ]
  },
  { sku:'LM-SER-002', name:'Lumina Hyaluronic Acid Hydrating Serum',
    desc:'Multi-weight hyaluronic acid serum for deep and surface hydration. Plumps dehydrated skin, smooths fine lines, and restores a bouncy, dewy complexion. Perfect for dry, sensitive, and dehydrated skin.',
    cat:'serums', price:'115.000', skins:['dry','sensitive','normal'],
    ing:['hyaluronic acid (3 weights)','glycerin','aloe vera','vitamin B5'],
    variants:[
      { sku:'LM-SER-002-30', name:'30ml', attr:{ size:'30ml' }, price:'115.000', compare:'140.000', stock:60, def:true  },
    ]
  },
  { sku:'LM-SER-003', name:'Lumina Retinol Anti-Age Serum',
    desc:'Advanced retinol serum for visible anti-aging results. Targets wrinkles, fine lines, and skin firmness. Stimulates collagen production and speeds cell turnover for smoother, younger-looking skin.',
    cat:'serums', price:'155.000', skins:['normal','combination','dry'],
    ing:['retinol 0.5%','bakuchiol','peptides','ceramides','vitamin E'],
    variants:[
      { sku:'LM-SER-003-30', name:'30ml', attr:{ size:'30ml' }, price:'155.000', compare:'190.000', stock:40, def:true  },
    ]
  },
  { sku:'LM-SER-004', name:'Lumina Niacinamide Pore Serum',
    desc:'10% niacinamide serum that minimises enlarged pores, controls sebum, and fades acne scars and hyperpigmentation. Improves skin texture and tone. Ideal for oily, acne-prone, and combination skin.',
    cat:'serums', price:'98.000', skins:['oily','combination'],
    ing:['niacinamide 10%','zinc PCA','hyaluronic acid','salicylic acid'],
    variants:[
      { sku:'LM-SER-004-30', name:'30ml', attr:{ size:'30ml' }, price:'98.000', compare:'120.000', stock:65, def:true  },
    ]
  },
  { sku:'LM-SER-005', name:'Lumina Calming Centella Serum',
    desc:'Centella asiatica serum that calms redness, soothes irritation, and heals blemishes. Perfect for sensitive, reactive, and acne-prone skin. Strengthens the skin barrier and reduces inflammation.',
    cat:'serums', price:'105.000', skins:['sensitive','oily','combination'],
    ing:['centella asiatica 80%','madecassoside','allantoin','panthenol'],
    variants:[
      { sku:'LM-SER-005-30', name:'30ml', attr:{ size:'30ml' }, price:'105.000', compare:'128.000', stock:55, def:true  },
    ]
  },

  // ── TONERS ──
  { sku:'LM-TON-001', name:'Lumina Hydrating Rose Toner',
    desc:'Alcohol-free hydrating toner with rose water to prep and plump skin. Balances pH, soothes redness, and adds a first layer of hydration. Ideal for dry, sensitive, and normal skin types.',
    cat:'toners', price:'58.000', skins:['dry','sensitive','normal'],
    ing:['rose water','glycerin','allantoin','hyaluronic acid'],
    variants:[
      { sku:'LM-TON-001-150', name:'150ml', attr:{ size:'150ml' }, price:'58.000', compare:'72.000', stock:80, def:true  },
    ]
  },
  { sku:'LM-TON-002', name:'Lumina AHA BHA Clarifying Toner',
    desc:'Exfoliating toner with AHA and BHA acids that unclogs pores, removes dead skin cells, and fights acne. Refines skin texture and reduces blackheads. For oily, combination, and acne-prone skin.',
    cat:'toners', price:'68.000', skins:['oily','combination'],
    ing:['glycolic acid 5%','salicylic acid 0.5%','lactic acid','witch hazel'],
    variants:[
      { sku:'LM-TON-002-150', name:'150ml', attr:{ size:'150ml' }, price:'68.000', compare:'85.000', stock:65, def:true  },
    ]
  },

  // ── FACE MASKS ──
  { sku:'LM-MSK-001', name:'Lumina Kaolin Clay Purifying Mask',
    desc:'Deep-cleansing kaolin clay mask that draws out impurities, absorbs excess sebum, and unclogs pores. Perfect for oily and acne-prone skin. Leaves skin feeling clean, smooth, and matte.',
    cat:'masks', price:'72.000', skins:['oily','combination'],
    ing:['kaolin clay','bentonite','salicylic acid','tea tree oil','zinc'],
    variants:[
      { sku:'LM-MSK-001-75', name:'75ml', attr:{ size:'75ml' }, price:'72.000', compare:'88.000', stock:55, def:true  },
    ]
  },
  { sku:'LM-MSK-002', name:'Lumina Hydrating Sleeping Mask',
    desc:'Overnight sleeping mask that intensely hydrates and plumps dehydrated, dry skin while you sleep. Rich in hyaluronic acid and ceramides for a supple, glowing complexion by morning.',
    cat:'masks', price:'85.000', skins:['dry','sensitive','normal'],
    ing:['hyaluronic acid','ceramides','shea butter','lavender extract','collagen'],
    variants:[
      { sku:'LM-MSK-002-75', name:'75ml', attr:{ size:'75ml' }, price:'85.000', compare:'105.000', stock:50, def:true  },
    ]
  },
  { sku:'LM-MSK-003', name:'Lumina Brightening Glow Mask',
    desc:'Vitamin C and turmeric brightening mask that fades dullness, dark spots, and hyperpigmentation. Boosts radiance and gives an instant luminous glow. Suitable for all skin types.',
    cat:'masks', price:'79.000', skins:['normal','combination','dry','oily'],
    ing:['vitamin C','turmeric','kojic acid','papaya enzyme','niacinamide'],
    variants:[
      { sku:'LM-MSK-003-75', name:'75ml', attr:{ size:'75ml' }, price:'79.000', compare:'98.000', stock:60, def:true  },
    ]
  },

  // ── SUN CARE ──
  { sku:'LM-SUN-001', name:'Lumina Daily SPF 50 Sunscreen',
    desc:'Lightweight SPF 50 broad-spectrum sunscreen that protects all skin types from UVA and UVB rays. Non-greasy, invisible finish. Hydrating formula with hyaluronic acid. Suitable for sensitive and dry skin.',
    cat:'suncare', price:'88.000', skins:['sensitive','dry','normal','oily','combination'],
    ing:['zinc oxide','hyaluronic acid','vitamin E','glycerin'],
    variants:[
      { sku:'LM-SUN-001-50', name:'50ml', attr:{ size:'50ml' }, price:'88.000', compare:'108.000', stock:90, def:true  },
    ]
  },
  { sku:'LM-SUN-002', name:'Lumina Matte SPF 50 Sunscreen',
    desc:'Oil-controlling matte-finish SPF 50 sunscreen for oily and combination skin. Blurs pores, controls shine, and provides full sun protection. Non-comedogenic and lightweight.',
    cat:'suncare', price:'92.000', skins:['oily','combination'],
    ing:['titanium dioxide','niacinamide','silica','zinc PCA'],
    variants:[
      { sku:'LM-SUN-002-50', name:'50ml', attr:{ size:'50ml' }, price:'92.000', compare:'115.000', stock:75, def:true  },
    ]
  },

  // ── EYE CARE ──
  { sku:'LM-EYE-001', name:'Lumina Peptide Eye Cream',
    desc:'Advanced peptide and caffeine eye cream that reduces dark circles, puffiness, and fine lines around the eyes. Firms and brightens the delicate eye area. Anti-aging formula suitable for all skin types.',
    cat:'eyecare', price:'110.000', skins:['normal','dry','combination','sensitive'],
    ing:['peptides','caffeine','retinol 0.1%','hyaluronic acid','vitamin K'],
    variants:[
      { sku:'LM-EYE-001-15', name:'15ml', attr:{ size:'15ml' }, price:'110.000', compare:'135.000', stock:45, def:true  },
    ]
  },

  // ── SHAMPOOS ──
  { sku:'LM-SHP-001', name:'Lumina Moisture Repair Shampoo',
    desc:'Nourishing argan oil shampoo for dry, brittle, and frizzy hair. Deeply moisturises and repairs damaged hair, reduces frizz, and restores shine. Sulphate-free formula safe for colour-treated hair.',
    cat:'shampoos', price:'65.000', skins:['normal'],
    ing:['argan oil','keratin','shea butter','vitamin E','panthenol'],
    variants:[
      { sku:'LM-SHP-001-250', name:'250ml', attr:{ size:'250ml', formulation:'Dry Hair' }, price:'65.000', compare:'80.000', stock:70, def:true  },
      { sku:'LM-SHP-001-500', name:'500ml', attr:{ size:'500ml', formulation:'Dry Hair' }, price:'110.000',compare:'135.000', stock:45, def:false },
    ]
  },
  { sku:'LM-SHP-002', name:'Lumina Purifying Scalp Shampoo',
    desc:'Clarifying shampoo for oily hair and greasy scalp. Removes excess sebum, product buildup, and dandruff. Purifying zinc and salicylic acid formula that balances scalp sebum production.',
    cat:'shampoos', price:'62.000', skins:['normal'],
    ing:['zinc pyrithione','salicylic acid','tea tree oil','peppermint'],
    variants:[
      { sku:'LM-SHP-002-250', name:'250ml', attr:{ size:'250ml', formulation:'Oily Hair' }, price:'62.000', compare:'78.000', stock:65, def:true  },
      { sku:'LM-SHP-002-500', name:'500ml', attr:{ size:'500ml', formulation:'Oily Hair' }, price:'105.000',compare:'128.000', stock:40, def:false },
    ]
  },
  { sku:'LM-SHP-003', name:'Lumina Curl Define Shampoo',
    desc:'Sulphate-free shampoo designed for curly, coily, and wavy hair. Defines curl pattern, reduces frizz, and adds moisture without weighing hair down. Enhanced with coconut oil and aloe vera.',
    cat:'shampoos', price:'68.000', skins:['normal'],
    ing:['coconut oil','aloe vera','shea butter','glycerin','silk proteins'],
    variants:[
      { sku:'LM-SHP-003-250', name:'250ml', attr:{ size:'250ml', formulation:'Curly Hair' }, price:'68.000', compare:'85.000', stock:55, def:true  },
    ]
  },
  { sku:'LM-SHP-004', name:'Lumina Volume Boost Shampoo',
    desc:'Lightweight volumising shampoo for fine and thin hair. Adds body and lift without heaviness. Strengthens fragile hair fibres and reduces breakage. Suitable for normal hair needing volume and shine.',
    cat:'shampoos', price:'59.000', skins:['normal'],
    ing:['biotin','hydrolysed wheat protein','vitamin B complex','green tea'],
    variants:[
      { sku:'LM-SHP-004-250', name:'250ml', attr:{ size:'250ml', formulation:'Fine Hair' }, price:'59.000', compare:'74.000', stock:60, def:true  },
    ]
  },

  // ── CONDITIONERS ──
  { sku:'LM-CON-001', name:'Lumina Argan Repair Conditioner',
    desc:'Rich argan oil conditioner for dry, damaged, and frizzy hair. Deeply nourishes and smooths the hair cuticle for silky, manageable capillair. Reduces frizz and adds brilliant shine.',
    cat:'conditioners', price:'62.000', skins:['normal'],
    ing:['argan oil','keratin','shea butter','vitamin E'],
    variants:[
      { sku:'LM-CON-001-250', name:'250ml', attr:{ size:'250ml', formulation:'Dry Hair' }, price:'62.000', compare:'78.000', stock:65, def:true  },
      { sku:'LM-CON-001-500', name:'500ml', attr:{ size:'500ml', formulation:'Dry Hair' }, price:'105.000',compare:'130.000', stock:40, def:false },
    ]
  },
  { sku:'LM-CON-002', name:'Lumina Lightweight Curl Conditioner',
    desc:'Moisturising conditioner for curly, coily, and wavy hair. Defines curls, eliminates frizz, and hydrates without weighing hair down. Detangles effortlessly.',
    cat:'conditioners', price:'62.000', skins:['normal'],
    ing:['coconut milk','aloe vera','glycerin','castor oil'],
    variants:[
      { sku:'LM-CON-002-250', name:'250ml', attr:{ size:'250ml', formulation:'Curly Hair' }, price:'62.000', compare:'78.000', stock:55, def:true  },
    ]
  },

  // ── HAIR MASKS ──
  { sku:'LM-HMK-001', name:'Lumina Intensive Repair Hair Mask',
    desc:'Deep conditioning treatment mask for very dry, brittle, and chemically treated hair. Restores moisture, repairs damage, and eliminates frizz with keratin and argan oil. Weekly capillair treatment.',
    cat:'hairmasks', price:'85.000', skins:['normal'],
    ing:['argan oil','keratin','collagen','shea butter','castor oil'],
    variants:[
      { sku:'LM-HMK-001-200', name:'200ml', attr:{ size:'200ml', formulation:'Dry Hair' }, price:'85.000', compare:'105.000', stock:50, def:true  },
    ]
  },
  { sku:'LM-HMK-002', name:'Lumina Scalp Detox Hair Mask',
    desc:'Purifying hair mask that detoxifies the scalp and removes buildup from oily and greasy hair. Balances scalp sebum, soothes irritation, and leaves hair feeling fresh and light.',
    cat:'hairmasks', price:'79.000', skins:['normal'],
    ing:['white clay','tea tree oil','peppermint','salicylic acid','zinc'],
    variants:[
      { sku:'LM-HMK-002-200', name:'200ml', attr:{ size:'200ml', formulation:'Oily Hair' }, price:'79.000', compare:'98.000', stock:45, def:true  },
    ]
  },

  // ── HAIR SERUMS ──
  { sku:'LM-HSR-001', name:'Lumina Frizz Control Hair Serum',
    desc:'Lightweight argan oil serum that tames frizz and flyaways for dry and curly hair. Adds brilliant shine and smoothness without greasiness. Apply to damp or dry hair as a finishing capillair serum.',
    cat:'hairserums', price:'72.000', skins:['normal'],
    ing:['argan oil','silicone','vitamin E','jojoba oil'],
    variants:[
      { sku:'LM-HSR-001-50', name:'50ml', attr:{ size:'50ml' }, price:'72.000', compare:'90.000', stock:60, def:true  },
    ]
  },

  // ── SCALP CARE ──
  { sku:'LM-SCP-001', name:'Lumina Scalp Soothing Serum',
    desc:'Targeted scalp serum that relieves dryness, flaking, and irritation. Balances sebum for oily scalps and hydrates dry scalps. Stimulates hair growth with caffeine and biotin.',
    cat:'scalp', price:'95.000', skins:['normal'],
    ing:['caffeine','biotin','niacinamide','salicylic acid 0.5%','zinc'],
    variants:[
      { sku:'LM-SCP-001-50', name:'50ml', attr:{ size:'50ml' }, price:'95.000', compare:'118.000', stock:40, def:true  },
    ]
  },

  // ── BODY LOTIONS ──
  { sku:'LM-BDL-001', name:'Lumina Body Glow Lotion',
    desc:'Lightweight body lotion with vitamin C and niacinamide that brightens skin tone, fades dark spots and hyperpigmentation on the body. Deeply moisturises and leaves a luminous, radiant glow.',
    cat:'bodylotions', price:'55.000', skins:['normal','dry','combination'],
    ing:['vitamin C','niacinamide','glycerin','shea butter','coconut oil'],
    variants:[
      { sku:'LM-BDL-001-250', name:'250ml', attr:{ size:'250ml' }, price:'55.000', compare:'68.000', stock:80, def:true  },
    ]
  },
  { sku:'LM-BDL-002', name:'Lumina Hydra-Rich Body Butter',
    desc:'Intensely rich body butter for very dry and dehydrated skin. Long-lasting moisture with shea butter and hyaluronic acid. Restores softness and smoothness. Fragrance available in Rose or Unscented.',
    cat:'bodylotions', price:'65.000', skins:['dry','sensitive'],
    ing:['shea butter','cocoa butter','hyaluronic acid','vitamin E'],
    variants:[
      { sku:'LM-BDL-002-200-R',  name:'200ml Rose',      attr:{ size:'200ml', scent:'Rose'      }, price:'65.000', compare:'80.000', stock:55, def:true  },
      { sku:'LM-BDL-002-200-U',  name:'200ml Unscented', attr:{ size:'200ml', scent:'Unscented' }, price:'65.000', compare:'80.000', stock:50, def:false },
    ]
  },

  // ── BODY SCRUBS ──
  { sku:'LM-BSC-001', name:'Lumina Coffee Body Scrub',
    desc:'Energising coffee and sugar body scrub that exfoliates dead skin cells, stimulates circulation, and leaves skin silky smooth. Reduces the appearance of cellulite. Suitable for all skin types.',
    cat:'bodyscrubs', price:'48.000', skins:['normal','dry','oily','combination'],
    ing:['coffee grounds','brown sugar','coconut oil','vitamin E','caffeine'],
    variants:[
      { sku:'LM-BSC-001-200', name:'200ml', attr:{ size:'200ml' }, price:'48.000', compare:'60.000', stock:70, def:true  },
    ]
  },
];

async function seedProducts() {
  for (const p of PRODUCTS) {
    const catId = CAT[p.cat as keyof typeof CAT].id;
    const productId = id();
    await db.insert(products).values({
      id:          productId,
      name:        p.name,
      description: p.desc,
      price:       p.price,
      categoryId:  catId,
      brand:       'Lumina',
      sku:         p.sku,
      stock:       p.variants.reduce((s:number, v:any) => s + v.stock, 0),
      images:      [],
      ingredients: p.ing,
      skinType:    p.skins,
      isActive:    true,
      hasVariants: p.variants.length > 1 || true,
      averageRating: '0',
      reviewCount:   0,
      createdAt:   now,
      updatedAt:   now,
    }).onConflictDoNothing();

    for (const v of p.variants) {
      await db.insert(productVariants).values({
        id:                id(),
        productId:         productId,
        sku:               v.sku,
        name:              v.name,
        attributes:        v.attr,
        price:             v.price,
        compareAtPrice:    v.compare,
        stock:             v.stock,
        lowStockThreshold: 10,
        images:            [],
        isActive:          true,
        isDefault:         v.def,
        createdAt:         now,
        updatedAt:         now,
      }).onConflictDoNothing();
    }
    console.log('seeded:', p.name);
  }
}

async function main() {
  await seedCategories();
  await seedProducts();
  console.log('DONE — all Lumina products seeded');
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
