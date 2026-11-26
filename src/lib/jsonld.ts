import type { SiteConfig, Category, PricingConfig, FaqItem, Review } from '@/lib/content/schemas';
import { absoluteUrl } from './seo';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Builds a `LocalBusiness` structured-data object for the whole site. */
export function localBusinessJsonLd(site: SiteConfig, categories: Category[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: site.brand,
    legalName: site.legalName,
    telephone: site.phoneLink,
    email: site.email,
    areaServed: site.areaServed,
    openingHours: site.workingHours,
    priceRange: 'BYN',
    sameAs: [site.instagramUrl, site.viberUrl],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Услуги',
      itemListElement: categories.map((category) => ({
        '@type': 'Service',
        name: category.title,
        url: `/uslugi/${category.slug}`
      }))
    }
  };
}

/** Builds a `Service` object with an offer whose `lowPrice` respects `minOrder`. */
export function serviceJsonLd(category: Category, site: SiteConfig, pricing: PricingConfig) {
  const minWorkPrice =
    category.works.length > 0
      ? Math.min(...category.works.map((work) => work.priceFrom))
      : pricing.minOrder;
  const lowPrice = Math.max(pricing.minOrder, minWorkPrice);

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: category.title,
    description: category.description,
    url: `/uslugi/${category.slug}`,
    areaServed: site.areaServed,
    provider: { '@type': 'LocalBusiness', name: site.brand },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: pricing.currency,
      lowPrice
    }
  };
}

/** Builds a `FAQPage` object from question/answer items. */
export function faqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer }
    }))
  };
}

/** Builds a `BreadcrumbList` object with absolute item URLs. */
export function breadcrumbJsonLd(items: BreadcrumbItem[], siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? absoluteUrl(item.href, siteUrl) : undefined
    }))
  };
}

/** Builds `Review` objects for real published reviews. */
export function reviewJsonLd(reviews: Review[]) {
  return reviews.map((review) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: { '@type': 'Person', name: review.name },
    datePublished: review.date,
    reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5 },
    itemReviewed: { '@type': 'Service', name: review.service },
    reviewBody: review.text
  }));
}
