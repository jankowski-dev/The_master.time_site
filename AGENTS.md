# AGENTS.md

Guidance for AI agents (and humans) working in this repository.

## Project

**The Master Time** — a handyman-on-call service site for Grodno. Astro 5 static
site + Node standalone adapter; lead collection delivered over email (SMTP) and
Viber.

## Stack

- Astro 5 (static pages) with the Node adapter (`standalone`).
- TypeScript in strict mode.
- Node 22, npm.
- Vitest (unit), Playwright + axe (E2E / a11y).
- ESLint (flat config) + Prettier.
- Zod for content-schema validation.

## Commands

```bash
npm install
npm run dev
npm run check && npm run lint && npm run test && npm run validate:content && npm run build
npm run test:e2e
```

Always run the full verification before declaring work complete.

## File map

```
src/data/            content (single source of truth) — edit here, never hardcode
src/lib/             pure logic (content, leads, pricing, phone, photo, analytics, seo, jsonld)
src/components/      Astro components (analytics, calculator, forms, layout, marketing, seo, ui)
src/pages/           routes + api/
src/scripts/         client-side TS (calculator, lead-form, price-filter, mobile-menu, tracking)
src/styles/          tokens.css (design tokens), global.css, utilities.css
tests/unit/          Vitest
tests/e2e/           Playwright
docs/                documentation and ADRs
```

## Data schemas

`src/lib/content/schemas.ts` defines the Zod schemas and their TypeScript types:

- `Work` — `id`, `title`, `priceFrom`, `priceTo?`, `unit`, `duration?`, `popular`, …
- `Category` — `slug`, `title`, `shortTitle`, `icon`, `description`, `seo`, `works`, `faq?`
- `CalculatorTask` — `id`, `categorySlug`, `label`, `workId`, optional price/duration overrides
- `PricingConfig` — `currency: 'BYN'`, `minOrder`, `urgentSurchargePercent`, `outOfTownFee`, `outOfTownRadiusKm`, `diagnosticsFee`, `disclaimer`
- `FaqItem`, `Condition`, `SiteConfig`, `Seo`

`src/lib/content/index.ts` loads and cross-checks content (unique slugs/ids,
calculator tasks reference existing categories and works). Run
`npm run validate:content` after any content change.

## Design tokens

`src/styles/tokens.css` — brand palette, radii, elevation, typography, layout,
motion. Colors meet WCAG AA: accent `#c7452c`, accent-strong `#a83a24`, ink
`#161312`. Prefer tokens over raw values.

## Lead flow

`[data-open-lead-form]` / `tmt:open-lead-form` → `LeadFormDialog` →
`LeadForm` → client validation (`src/scripts/lead-form.ts`) →
`POST /api/lead` (`src/pages/api/lead.ts`) → `handleLead`
(`src/lib/leads/handle.ts`) → validate (`validate.ts`) + rate limit
(`rate-limit.ts`) → `notifyLead` (`notify.ts`) fans out to email (`email.ts`)
and Viber (`viber.ts`). A no-JS fallback posts natively and redirects to
`/spasibo`.

## Analytics

Events are emitted through `track()` (`src/lib/analytics.ts`) and listed in
`docs/analytics.md`. No PII is ever sent to analytics. See that doc before
adding a new event.

## Definition of done

- `npm run check`, `npm run lint`, `npm run test`, `npm run validate:content`,
  `npm run build`, `npm run test:e2e` all pass.
- No `Pracue`, no Notion/Express/Multer, no fixed `1920`/`402` stages, no
  splash, no fake data/guarantees/reviews, no hardcoded prices, no secrets.
- `git status` shows only intended changes; no `.env`.

## Guardrails — do not

- **Never** rename the brand away from **The Master Time** (no `Pracue`).
- **Never** reintroduce Notion, Telegram, Express, or Multer.
- **Never** add fixed `1920`/`402` stages or a splash screen.
- **Never** hardcode prices, guarantees, follower counts, or any fake social
  proof. All content comes from `src/data`.
- **Never** add reviews. Reviews were cancelled (2026-11-26) and removed from
  scope; see `docs/decisions/ADR-004-reviews-out-of-scope.md`.
- **Never** commit `.env` or secrets — only `.env.example` placeholders.
- **Never** delete `uploads/` or other real user data without confirmation; the
  new app does not persist uploads (photos are emailed only).

## How to add a service / price / page

1. Add a `Category` (or a `Work` to an existing category) in
   `src/data/categories.ts`; optionally add calculator tasks in
   `src/data/calculator.ts` and FAQ items in `src/data/faq.ts`.
2. Run `npm run validate:content`.
3. A category page `/uslugi/[slug]`, price rows on `/ceny`, and the calculator
   pick up the change automatically (they iterate over content).

## How to run tests

```bash
npm run test                                   # unit
npm run test:e2e                               # E2E (builds first)
npm run test:e2e -- tests/e2e/a11y.spec.ts     # accessibility only
```
