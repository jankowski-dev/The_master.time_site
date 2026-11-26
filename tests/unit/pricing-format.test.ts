import { describe, it, expect } from 'vitest';
import type { Category, PricingConfig } from '@/lib/content/schemas';
import { formatPrice, formatRange, getCategoryPriceFrom } from '@/lib/pricing/format';

const pricing: PricingConfig = {
  currency: 'BYN',
  minOrder: 30,
  urgentSurchargePercent: 20,
  outOfTownFee: 20,
  outOfTownRadiusKm: 20,
  diagnosticsFee: 0,
  diagnosticsWaivedOnWork: true,
  disclaimer: 'Ориентировочно.'
};

const category: Category = {
  slug: 's',
  title: 'S',
  shortTitle: 'S',
  icon: 'i',
  description: 'd',
  seo: { title: 't', description: 'd' },
  works: [
    { id: 'w1', title: 'W1', priceFrom: 40, priceTo: 60, unit: 'работа', includes: [], popular: false },
    { id: 'w2', title: 'W2', priceFrom: 50, priceTo: 80, unit: 'работа', includes: [], popular: false }
  ],
  faq: []
};

describe('formatPrice', () => {
  it('formats a whole number with currency', () => {
    expect(formatPrice(40)).toBe('40 BYN');
  });
});

describe('formatRange', () => {
  it('formats a two-bound range', () => {
    expect(formatRange(40, 60)).toBe('40–60 BYN');
  });

  it('formats a from-only range', () => {
    expect(formatRange(40)).toBe('от 40 BYN');
  });

  it('formats equal bounds as from-only', () => {
    expect(formatRange(40, 40)).toBe('от 40 BYN');
  });
});

describe('getCategoryPriceFrom', () => {
  it('returns the cheapest work price', () => {
    expect(getCategoryPriceFrom(category, pricing)).toBe(40);
  });

  it('floors at min order', () => {
    const cheap: Category = {
      ...category,
      works: [
        { id: 'w1', title: 'W1', priceFrom: 10, priceTo: 20, unit: 'работа', includes: [], popular: false }
      ]
    };
    expect(getCategoryPriceFrom(cheap, pricing)).toBe(30);
  });
});
