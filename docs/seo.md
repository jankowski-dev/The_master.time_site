# SEO

## Routes & meta

Every page sets `title`, `description`, `canonical` (and often `noindex`) via
`Seo.astro`, which also emits Open Graph and Twitter card tags. Titles are
appended with `| The Master Time` unless they already contain the brand
(`src/lib/seo.ts`).

| Route           | Indexing | Notes                              |
| --------------- | -------- | ---------------------------------- |
| `/`, `/uslugi`, `/uslugi/[slug]`, `/ceny`, `/kalkulyator`, `/usloviya`, `/o-mastere`, `/kontakty` | index | category pages carry keyword-rich titles/descriptions |
| `/zayavka`, `/spasibo`, `/politika-konfidencialnosti` | noindex | excluded from sitemap too |

## JSON-LD

`src/lib/jsonld.ts` builds:

- `LocalBusiness` (home + contacts) — name, legalName, telephone, email,
  areaServed, openingHours, sameAs, offer catalog.
- `Service` + `AggregateOffer` (category pages), with `lowPrice` respecting
  `minOrder`.
- `FAQPage` (home/calculator/category pages with FAQ).
- `BreadcrumbList` (subpages).

## Sitemap & robots

- `@astrojs/sitemap` generates `/sitemap-index.xml` → `/sitemap-0.xml`, with a
  filter excluding `/spasibo/`, `/zayavka/`, `/politika-konfidencialnosti/`.
- `src/pages/robots.txt.ts` emits `User-agent: *`, `Allow: /`,
  `Disallow: /spasibo`, `Disallow: /zayavka`, and `Sitemap: <origin>/sitemap-index.xml`.

## Keyword map (target)

- «мастер на час гродно» — home, `/o-mastere`
- «сантехника гродно», «электрика гродно», … — per-category pages
- «цены мастер на час гродно» — `/ceny`
- «калькулятор стоимости работ» — `/kalkulyator`

## Content plan

1. Replace demo meta copy with keyword-targeted, unique descriptions per page
   (already drafted in `src/data` + page frontmatter).
2. Submit the sitemap in Google Search Console and Yandex Webmaster after
   cutover.
3. Set up GA4/Ads IDs and Yandex Metrika goals (see `docs/analytics.md`).
