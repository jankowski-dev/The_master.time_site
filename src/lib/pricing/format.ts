import type { Category, PricingConfig } from '@/lib/content/schemas';

const formatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

/** Formats a whole-BY amount as `40 BYN`. */
export function formatPrice(value: number): string {
  return `${formatter.format(value)} BYN`;
}

/** Formats `40–60 BYN`, or `от 40 BYN` when there is no upper bound. */
export function formatRange(from: number, to?: number): string {
  if (to === undefined || to === from) {
    return `от ${formatter.format(from)} BYN`;
  }
  return `${formatter.format(from)}–${formatter.format(to)} BYN`;
}

/** Lowest advertised price for a category, floored at the minimum order. */
export function getCategoryPriceFrom(category: Category, pricing: PricingConfig): number {
  const minPriceFrom = Math.min(...category.works.map((work) => work.priceFrom));
  return Math.max(pricing.minOrder, minPriceFrom);
}
