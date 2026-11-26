# The Master Time

Website for **The Master Time** — a handyman-on-call («мастер на час») service in
Grodno, Belarus. Static, fast, privacy-aware, and served from a single Node
process.

The site lists services and prices, calculates an approximate cost, and collects
leads (phone + optional photos) that are delivered by email (SMTP) and Viber.

## Stack

- **Astro 5** (static pages) with the **Node adapter** (`standalone`).
- **TypeScript** in strict mode.
- **Node 22**, **npm**.
- **Zod** for content-schema validation at build time.
- **Vitest** for unit tests, **Playwright** (+ `@axe-core/playwright`) for E2E
  and accessibility tests.
- **ESLint** (flat config) + **Prettier**.

## Quick start

```bash
npm install
cp .env.example .env        # fill in real values before going live
npm run dev                 # http://localhost:4321
```

## Scripts

| Command                     | Description                                            |
| --------------------------- | ------------------------------------------------------ |
| `npm run dev`               | Astro dev server                                       |
| `npm run build`             | Validate content, then build the production bundle     |
| `npm run start`             | Run the built standalone Node server                   |
| `npm run preview`           | Preview the production build                           |
| `npm run check`             | `astro check` (types + template diagnostics)           |
| `npm run lint`              | ESLint                                                 |
| `npm run format`            | Prettier (writes)                                      |
| `npm run test`              | Unit tests (Vitest)                                    |
| `npm run test:watch`        | Vitest in watch mode                                   |
| `npm run test:e2e`          | End-to-end tests (Playwright, builds first)            |
| `npm run validate:content`  | Validate `src/data` against the Zod schemas            |

Full verification:

```bash
npm run check && npm run lint && npm run test && npm run validate:content && npm run build && npm run test:e2e
```

## Environment

See `.env.example`. Public, build-time values are prefixed `PUBLIC_` and read
via `import.meta.env`; server secrets are read from `process.env`.

| Variable                 | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `SITE_URL`               | Canonical origin (canonical, sitemap, robots)        |
| `PORT`                   | Server port (default `4321`)                         |
| `PUBLIC_YM_ID`           | Yandex Metrika counter id (default `112934654`)      |
| `PUBLIC_GA_ID`           | Google Analytics id (optional)                       |
| `PUBLIC_GOOGLE_ADS_ID`   | Google Ads id (optional)                             |
| `SMTP_HOST` … `MAIL_TO`  | Outgoing SMTP for lead email delivery                |
| `VIBER_AUTH_TOKEN`       | Viber Bot API token                                  |
| `VIBER_ADMIN_ID`         | Viber admin chat id (lead notifications go here)     |
| `LEAD_TEST_MODE`         | `1` short-circuits delivery (in-memory notifier)     |

`CRM_WEBHOOK_URL` and `VIBER_WEBHOOK_SECRET` are reserved placeholders for
future work (see `docs/ai-roadmap.md`); they are not wired yet.

Never commit `.env` or secrets — `.env.example` holds placeholders only.

## Routes

| Path                            | Description                                        |
| ------------------------------- | -------------------------------------------------- |
| `/`                             | Home                                               |
| `/uslugi`                       | Service catalog                                    |
| `/uslugi/[slug]`                | Category page (6 categories)                       |
| `/ceny`                         | Searchable price list                              |
| `/kalkulyator`                  | 3-step estimate calculator                         |
| `/usloviya`                     | Terms (hours, min order, urgent, out-of-town, …)   |
| `/o-mastere`                    | About                                              |
| `/kontakty`                     | Contacts                                           |
| `/zayavka`                      | Standalone lead form (no-JS / ads friendly)        |
| `/spasibo`                      | Thank-you after a native form submission           |
| `/politika-konfidencialnosti`   | Privacy policy                                     |
| `404`                           | Not-found (server-rendered, real 404)              |
| `POST /api/lead`                | Lead submission                                    |
| `GET /api/health`               | Health check                                       |
| `POST /api/viber/webhook`       | Viber webhook (signature-verified)                 |

`/zayavka`, `/spasibo`, and `/politika-konfidencialnosti` are `noindex` and
excluded from the sitemap.

## Project structure

```
src/
  assets/icons/        SVG icons (referenced by name via <Icon>)
  components/          Astro components (analytics, calculator, forms, layout, marketing, seo, ui)
  data/                The single source of truth for content (categories, pricing, calculator, faq, conditions, site)
  layouts/             BaseLayout.astro (head, header, footer, sticky CTA, consent, scripts)
  lib/                 Pure logic: content schemas, leads pipeline, pricing, phone, photo, analytics, seo, jsonld
  pages/               Routes (including api/)
  scripts/             Client-side TS: calculator, lead-form, price-filter, mobile-menu, tracking
  styles/              Design tokens, global + utility CSS
tests/
  unit/                Vitest tests
  e2e/                 Playwright tests (incl. a11y.spec.ts)
docs/                  Developer & AI documentation (see below)
scripts/               validate-content.ts and photo fixture generator
```

## Content

All copy, prices, and structure live in `src/data` and are validated by Zod at
build time (`npm run validate:content`). Prices are demo values — replace them
before launch. See `docs/content-guide.md`.

## Documentation

- `docs/architecture.md` — system overview and data flow
- `docs/content-guide.md` — how to edit content
- `docs/design-system.md` — tokens, typography, components, a11y
- `docs/analytics.md` — event vocabulary, consent, UTM
- `docs/seo.md` — meta, JSON-LD, sitemap/robots
- `docs/deployment.md` — Railway, SMTP/Viber setup, cutover
- `docs/ai-roadmap.md` — future RAG/assistant plan
- `docs/qa.md` — test matrix and launch checklist
- `docs/decisions/` — architecture decision records
