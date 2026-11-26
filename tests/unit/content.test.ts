import { describe, it, expect } from 'vitest';
import { CategorySchema } from '@/lib/content/schemas';
import {
  loadContent,
  parseContent,
  getCategoryBySlug,
  getPopularWorks,
  ContentValidationError
} from '@/lib/content';
import { siteData } from '@/data/site';
import { pricingData } from '@/data/pricing';

describe('content', () => {
  it('loads six categories with expected slugs', () => {
    const { categories } = loadContent();
    expect(categories.map((c) => c.slug)).toEqual([
      'santehnika',
      'elektrika',
      'remont-otdelka',
      'mebel',
      'bytovaya-tehnika',
      'melkie-raboty'
    ]);
  });

  it('finds a category by slug', () => {
    expect(getCategoryBySlug('santehnika')?.title).toBe('Сантехника');
  });

  it('returns six popular works', () => {
    expect(getPopularWorks(6)).toHaveLength(6);
  });

  it('uses SVG icon names for categories', () => {
    expect(loadContent().categories.map((c) => c.icon)).toEqual([
      'service-plumbing',
      'service-electric',
      'service-renovation',
      'service-furniture',
      'service-appliances',
      'service-misc'
    ]);
  });

  it('rejects a bad slug', () => {
    const result = CategorySchema.safeParse({
      slug: 'Bad Slug',
      title: 'X',
      shortTitle: 'X',
      icon: 'x',
      description: 'X',
      seo: { title: 'X', description: 'X' },
      works: [{ id: 'w', title: 'W', priceFrom: 10 }],
      faq: []
    });
    expect(result.success).toBe(false);
  });

  it('rejects duplicate work ids across categories', () => {
    const category = {
      slug: 'a',
      title: 'A',
      shortTitle: 'A',
      icon: 'a',
      description: 'A',
      seo: { title: 'A', description: 'A' },
      works: [{ id: 'same', title: 'W', priceFrom: 10 }],
      faq: []
    };
    const raw = {
      site: siteData,
      categories: [category, { ...category, slug: 'b', title: 'B', shortTitle: 'B' }],
      calculatorTasks: [],
      pricing: pricingData,
      faqs: [],
      conditions: []
    };
    expect(() => parseContent(raw)).toThrow(ContentValidationError);
  });
});
