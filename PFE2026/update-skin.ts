import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();
import { db } from './src/infrastructure/db/index.js';
import { products } from './src/infrastructure/db/schema/products.js';
import { eq } from 'drizzle-orm';

const updates = [
  { id: 'prod_001', skinType: ['dry','normal'], description: 'Deeply hydrating serum with hyaluronic acid. Ideal for dry and dehydrated skin.' },
  { id: 'prod_002', skinType: ['all','dull'], description: 'Brightening daily moisturizer with Vitamin C. Evens skin tone for all skin types.' },
  { id: 'prod_003', skinType: ['sensitive','dry'], description: 'Sulfate-free gentle foam cleanser for sensitive and dry skin. Soothes redness.' },
  { id: 'prod_004', skinType: ['oily','combination','all'], description: 'Lightweight non-greasy daily sunscreen SPF50. Perfect for oily and combination skin.' },
  { id: 'prod_005', skinType: ['dry','mature'], description: 'Rich overnight cream with retinol for anti-aging. Best for dry and mature skin.' },
  { id: 'prod_006', skinType: ['oily','combination'], description: 'Alcohol-free toner that minimizes pores. Ideal for oily and acne-prone skin.' },
  { id: 'prod-001', skinType: ['dry','normal'], description: 'Crème riche à l huile d argan pure de Tunisie. Hydrate intensément les peaux sèches.' },
  { id: 'prod-002', skinType: ['all','sensitive'], description: 'Gel nettoyant doux à l eau de rose de Gammarth. Convient à tous types de peau.' },
  { id: 'prod-003', skinType: ['oily','combination'], description: 'Masque à l argile verte purifiant pour peaux grasses. Contrôle le sébum et les pores.' },
  { id: 'prod-004', skinType: ['dry','mature'], description: 'Sérum luxueux anti-âge à l huile de figue de barbarie. Pour peaux sèches et matures.' },
  { id: 'prod-005', skinType: ['all','sensitive'], description: 'Savon artisanal au lait de chèvre frais. Doux pour tous types de peau.' },
  { id: 'prod-006', skinType: ['normal','dry'], description: 'Lotion légère à l huile d olive tunisienne. Hydrate et nourrit les peaux normales.' },
  { id: 'prod-009', skinType: ['oily','combination','all'], description: 'Protection solaire haute performance SPF50 pour le visage. Non grasse, idéale peaux mixtes.' },
  { id: 'prod-013', skinType: ['dull','all'], description: 'Sérum concentré en vitamine C pour illuminer le teint terne. Pour tous types de peau.' },
  { id: 'prod-018', skinType: ['oily','combination'], description: 'Argile rhassoul naturelle purifiante pour visage et cheveux gras. Absorbe le sébum.' },
  { id: 'prod-021', skinType: ['sensitive','dry'], description: 'Toner doux à la camomille tunisienne. Calme les rougeurs et peaux sensibles.' },
  { id: 'prod-023', skinType: ['oily','combination'], description: 'Lotion tonique purifiante au citron tunisien pour peaux grasses et acnéiques.' },
];

async function run() {
  for (const u of updates) {
    await db.update(products).set({ skinType: u.skinType, description: u.description }).where(eq(products.id, u.id));
    console.log('Updated', u.id);
  }
  console.log('Done');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
