import { describe, it, expect } from 'vitest';
import {
  localBusinessJsonLd,
  serviceJsonLd,
  faqJsonLd,
  breadcrumbJsonLd,
  reviewJsonLd
} from '@/lib/jsonld';
import { site, pricing, categories } from '@/lib/content';
import type { Category } from '@/lib/content/schemas';

function makeCategory(priceFroms: number[]): Category {
  return {
    slug: 'test',
    title: 'Тест',
    shortTitle: 'Тест',
    icon: 'service-misc',
    description: 'Описание',
    seo: { title: 'Тест', description: 'Описание' },
    works: priceFroms.map((priceFrom, index) => ({
      id: `w${index}`,
      title: `Работа ${index}`,
      priceFrom,
      unit: 'работа' as const,
      includes: [],
      popular: false
    })),
    faq: []
  };
}

describe('jsonld', () => {
  it('builds LocalBusiness', () => {
    const ld = localBusinessJsonLd(site, categories);
    expect(ld['@type']).toBe('LocalBusiness');
    expect(ld.telephone).toBe(site.phoneLink);
    expect(ld.areaServed).toBe(site.areaServed);
    expect(ld.sameAs).toContain(site.instagramUrl);
    expect(ld.sameAs).toContain(site.viberUrl);
  });

  it('builds Service with url, areaServed and BYN currency', () => {
    const ld = serviceJsonLd(categories[0], site, pricing);
    expect(ld['@type']).toBe('Service');
    expect(ld.url).toBe('/uslugi/santehnika');
    expect(ld.areaServed).toBe(site.areaServed);
    expect(ld.offers.priceCurrency).toBe('BYN');
  });

  it('uses the minimum work price when it is above minOrder', () => {
    const ld = serviceJsonLd(makeCategory([100, 200]), site, pricing);
    expect(ld.offers.lowPrice).toBe(100);
  });

  it('floors lowPrice at minOrder when the cheapest work is below it', () => {
    const ld = serviceJsonLd(makeCategory([10, 50]), site, pricing);
    expect(ld.offers.lowPrice).toBe(30);
  });

  it('builds FAQPage', () => {
    const ld = faqJsonLd([{ question: 'Сколько стоит?', answer: '30 BYN' }]);
    expect(ld['@type']).toBe('FAQPage');
    expect(ld.mainEntity).toHaveLength(1);
    expect(ld.mainEntity[0]['@type']).toBe('Question');
    expect(ld.mainEntity[0].name).toBe('Сколько стоит?');
    expect(ld.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
  });

  it('builds BreadcrumbList with absolute item urls', () => {
    const ld = breadcrumbJsonLd(
      [
        { label: 'Главная', href: '/' },
        { label: 'Услуги', href: '/uslugi' },
        { label: 'Сантехника' }
      ],
      'https://x.by'
    );
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement).toHaveLength(3);
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[0].name).toBe('Главная');
    expect(ld.itemListElement[0].item).toBe('https://x.by/');
    expect(ld.itemListElement[1].item).toBe('https://x.by/uslugi');
    expect(ld.itemListElement[2].item).toBeUndefined();
  });

  it('builds Review objects', () => {
    const ld = reviewJsonLd([
      { id: 'r1', name: 'Иван', date: '2026-01-01', service: 'Сантехника', rating: 5, text: 'Отлично', published: true }
    ]);
    expect(ld).toHaveLength(1);
    expect(ld[0]['@type']).toBe('Review');
    expect(ld[0].reviewRating.ratingValue).toBe(5);
  });

  it('returns an empty array for no reviews', () => {
    expect(reviewJsonLd([])).toEqual([]);
  });
});
