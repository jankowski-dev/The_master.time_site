# The Master Time Site Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить легаси-сайт на фиксированных сценах (Express + Notion) быстрым адаптивным сайтом на Astro: шесть категорий услуг с прозрачными ценами в BYN, калькулятор за 60 секунд, короткая заявка с доставкой на email + Viber, Instagram-механика «фото в директ» и документация для разработчика/ИИ.

**Architecture:** Astro 5 отдаёт статические страницы и держит SSR только для API. Контент — типизированный JSON с Zod-валидацией на сборке. Интерактив — ванильный TypeScript: калькулятор, форма, фильтр цен, consent, аналитика. Заявки идут через `LeadNotifier`: email (Nodemailer/SMTP) обязателен, Viber Bot API опционален, CRM-вебхук — задел на будущее. Деплой — Railway, статика через Cloudflare.

**Tech Stack:** Astro 5, TypeScript strict, Node 22, Zod, Nodemailer, Vitest, Playwright, axe-core, ESLint/Prettier, GitHub Actions, Railway.

**Spec:** `docs/superpowers/specs/2026-11-26-the-master-time-site-redesign-design.md`

## Global Constraints

- Бренд только **The Master Time**. Слово `Pracue` не должно встречаться в коде, текстах, package.json и документации.
- Язык сайта — русский, валюта — BYN. Тексты без канцелярита.
- Телефон: `+375 25 707-67-93`, ссылка `tel:+375257076793`.
- Instagram: `https://www.instagram.com/the_master.time/`, директ `https://ig.me/m/the_master.time`.
- Viber: `viber://chat?number=%2B375257076793`.
- География: Гродно и до 20 км включительно; дальше — «Уточним по телефону», без расчёта.
- Никакого Notion, Telegram, Express, Multer, фиксированных сцен 1920/402, JS-масштабирования и splash-экрана.
- Astro + TypeScript strict + Node-адаптер. Страницы статические, API — SSR (`export const prerender = false`).
- Никакого тяжёлого SPA/React/Vue на этапе 1. Только ванильный TS для интерактива.
- Все цены — только из `src/data`, никаких хардкодов в компонентах. Демо-цены помечены комментарием `// demo`.
- Калькулятор: база из задачи/работы; срочность — процент к обеим границам; загород — фиксированная доплата; минимальный заказ — после наценок; диагностика — отдельной строкой; без `priceTo` — только «от», без выдуманного потолка; округление вверх до целого BYN.
- Заявки: email — обязательный канал, Viber — дополнительный. Если оба упали — 502 и телефон/Viber клиенту. Фото на диске не храним.
- Фото: до 3 файлов, клиентское сжатие до ~1600 px и ~2 МБ, серверный лимит 4 МБ/файл и 10 МБ всего; JPEG/PNG/WebP; HEIC пробуем сконвертировать, иначе — Instagram/Viber.
- Аналитика грузится только после согласия на cookies. Yandex Metrika ID `112934654`; GA4/Google Ads — из env. Никаких PII в событиях.
- Доступность: WCAG 2.1 AA, клавиатура, focus-visible, `aria-live`, `prefers-reduced-motion`.
- Бюджеты: initial JS < 100 КБ gzip (без аналитики), CSS < 50 КБ gzip, LCP < 2.5 с на 4G, CLS < 0.1.
- Legacy-сайт на `main` остаётся живым до cutover. Не мержить и не деплоить новую ветку в прод без отдельного подтверждения.
- Не удалять `uploads/` и любые данные, пока не подтверждено, что они тестовые. Сомнительное — архивировать.
- Секреты только в env. В клиент — только `PUBLIC_*`.
- Каждая задача заканчивается зелёными `npm run check`, `npm run lint`, `npm run test`, `npm run build` и коммитом.

## Review Focus

Эти пять классов ошибок не покрываются «счастливым путём» и должны получить тесты в указанных задачах:

1. **Телефоны**: `+375`, `375`, `80`, `8`, локальные 9 цифр, пробелы/дефисы, неверный код оператора, буквы. Ожидание: нормализация или понятная ошибка, никогда не отправлять невалидный номер. Тесты: Task 3 (unit), Task 11 (E2E).
2. **Границы калькулятора**: нет `priceTo`; минимальный заказ выше базы; срочность + загород одновременно; адрес дальше 20 км. Ожидание: нет фейкового потолка, корректный clamp, «уточним» вместо цены. Тесты: Task 5 (unit), Task 12 (E2E).
3. **Фото**: HEIC, >2 МБ, >3 файлов, не-картинка, общий размер >10 МБ. Ожидание: сжатие или понятная ошибка, письмо не превышает лимиты, форма не зависает. Тесты: Task 11 (unit + E2E).
4. **Доставка заявки**: email упал, Viber упал, оба упали. Ожидание: если дошёл хотя бы один канал — успех; если оба — 502 и телефон/Viber клиенту, данные не теряются молча. Тесты: Task 7 (unit), Task 11 (E2E).
5. **Атрибуция и согласие**: UTM/gclid/yclid между страницами, отказ от cookies, localStorage недоступен/переполнен. Ожидание: атрибуция прикладывается, аналитика не грузится без согласия, приложение не падает. Тесты: Task 3 (unit), Task 15 (E2E).

## Execution Context

- Перед Task 1 вызвать `superpowers:using-git-worktrees`, создать worktree и ветку `rebuild/the-master-time` от `main`. Все задачи — только в этой ветке.
- Node 22, npm. `package-lock.json` коммитится.
- После каждой задачи — отдельный коммит (Conventional Commits).
- Перед каждым коммитом: `npm run check && npm run lint && npm run test && npm run build`.
- E2E запускать после задач, меняющих страницы/формы; в CI — всегда.
- Все пути импортов — через alias `@/` → `src/`.
- Демо-данные (цены, часы) явно помечать `// demo` и не считать финальными.
- **Отзывы полностью исключены из объёма (решение владельца 2026-11-26):** нет страницы `/otzyvy`, формы отзыва, API, блока на главной, ссылок в навигации, схемы `Review` и JSON-LD отзывов.

## File Structure

```text
/
├─ src/
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ uslugi/index.astro
│  │  ├─ uslugi/[slug].astro
│  │  ├─ ceny.astro
│  │  ├─ kalkulyator.astro
│  │  ├─ zayavka.astro
│  │  ├─ usloviya.astro
│  │  ├─ o-mastere.astro
│  │  ├─ kontakty.astro
│  │  ├─ spasibo.astro
│  │  ├─ politika-konfidencialnosti.astro
│  │  ├─ 404.astro
│  │  ├─ robots.txt.ts
│  │  └─ api/
│  │     ├─ lead.ts
│  │     ├─ health.ts
│  │     └─ viber/webhook.ts
│  ├─ layouts/BaseLayout.astro
│  ├─ components/
│  │  ├─ layout/{Header,Footer,Container,Section,Breadcrumbs,StickyCta}.astro
│  │  ├─ ui/{Button,Icon,Card,Badge,Accordion,Field,PhoneField,Checkbox,Spinner,InlineStatus}.astro
│  │  ├─ marketing/{Hero,TrustBar,ServiceGrid,ServiceCard,PriceTable,PriceRow,HowItWorks,InstagramBlock,Faq,ContactBlock,CtaBand}.astro
│  │  ├─ calculator/{Calculator,CalculatorStep,EstimateBreakdown}.astro
│  │  ├─ forms/{LeadForm,LeadFormDialog,ConsentField,PhotoUpload}.astro
│  │  ├─ analytics/{Analytics,ConsentBanner}.astro
│  │  └─ seo/{Seo,JsonLd}.astro
│  ├─ data/
│  │  ├─ site.ts
│  │  ├─ categories.ts
│  │  ├─ calculator.ts
│  │  ├─ pricing.ts
│  │  ├─ faq.ts
│  │  └─ conditions.ts
│  ├─ lib/
│  │  ├─ content/{schemas.ts,index.ts}
│  │  ├─ pricing/{types.ts,calculate.ts,format.ts}
│  │  ├─ leads/{types.ts,validate.ts,format.ts,email.ts,viber.ts,notify.ts,rate-limit.ts,handle.ts,test-notifier.ts}
│  │  ├─ phone.ts
│  │  ├─ attribution.ts
│  │  ├─ consent.ts
│  │  ├─ analytics.ts
│  │  ├─ seo.ts
│  │  ├─ jsonld.ts
│  │  ├─ photo.ts
│  │  └─ env.ts
│  ├─ scripts/{mobile-menu.ts,lead-form.ts,calculator.ts,price-filter.ts,tracking.ts}
│  ├─ assets/{icons/*.svg,images/*}
│  └─ styles/{tokens.css,global.css,utilities.css}
├─ public/
├─ scripts/validate-content.ts
├─ tests/
│  ├─ unit/*.test.ts
│  └─ e2e/*.spec.ts
├─ astro.config.mjs
├─ package.json
├─ tsconfig.json
├─ vitest.config.ts
├─ playwright.config.ts
├─ eslint.config.js
├─ .prettierrc
├─ .env.example
├─ README.md
├─ AGENTS.md
└─ docs/
```

---

### Task 1: Scaffold Astro, tooling, CI, health API

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.env.example`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `.github/workflows/ci.yml`, `src/env.d.ts`, `src/pages/index.astro` (placeholder), `src/pages/api/health.ts`, `tests/e2e/smoke.spec.ts`, `README.md` (skeleton), `AGENTS.md` (skeleton).

**Interfaces:**
- Produces: `npm run dev`, `build`, `start`, `check`, `lint`, `test`, `test:e2e`; `GET /api/health` → `{ ok: true, service: "the-master-time" }`.
- Produces: `SITE_URL`, `PORT`, `LEAD_TEST_MODE` env contract.

- [ ] **Step 1: Create the worktree and branch**

Use the `using-git-worktrees` skill. Branch: `rebuild/the-master-time`. All later commits happen there. Do not touch `main`.

- [ ] **Step 2: Create `package.json` and install dependencies**

Scripts:
```json
{
  "dev": "astro dev",
  "build": "astro build",
  "start": "node ./dist/server/entry.mjs",
  "preview": "astro preview",
  "check": "astro check",
  "lint": "eslint .",
  "format": "prettier --write .",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test"
}
```
Name: `the-master-time`, `"type": "module"`, `"private": true`, engines Node `>=22`.

Dependencies: `astro`, `@astrojs/node`, `@astrojs/sitemap`, `zod`, `nodemailer`, `@fontsource/montserrat`.
Dev: `typescript`, `@astrojs/check`, `vitest`, `@playwright/test`, `@axe-core/playwright`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-astro`, `eslint-config-prettier`, `prettier`, `prettier-plugin-astro`, `tsx`.

Run `npm install` and commit `package-lock.json`.

- [ ] **Step 3: Create Astro and TypeScript config**

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:4321',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [sitemap()]
});
```
`tsconfig.json` extends `astro/tsconfigs/strict`, adds `baseUrl: "."`, `paths: { "@/*": ["src/*"] }`.

`vitest.config.ts`: alias `@` → `src`, include `tests/unit/**/*.test.ts`, `environment: 'node'`.
`playwright.config.ts`: `testDir: 'tests/e2e'`, `baseURL: 'http://localhost:4321'`, `webServer: { command: 'npm run build && npm run start', port: 4321, reuseExistingServer: !process.env.CI, env: { PORT: '4321', SITE_URL: 'http://localhost:4321', LEAD_TEST_MODE: '1' } }`, `use: { trace: 'retain-on-failure' }`.
`src/env.d.ts`: `/// <reference types="astro/client" />` plus `ImportMetaEnv` typings for `PUBLIC_YM_ID`, `PUBLIC_GA_ID`, `PUBLIC_GOOGLE_ADS_ID`, `SITE_URL`.
`.env.example`: `SITE_URL`, `PUBLIC_YM_ID=112934654`, `PUBLIC_GA_ID`, `PUBLIC_GOOGLE_ADS_ID`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO`, `VIBER_AUTH_TOKEN`, `VIBER_ADMIN_ID`, `VIBER_WEBHOOK_SECRET`, `CRM_WEBHOOK_URL`, `LEAD_TEST_MODE`.
`.gitignore`: `node_modules/`, `dist/`, `.astro/`, `.env`, `test-results/`, `playwright-report/`, `uploads/`, `server.log`, `server-err.log`.

- [ ] **Step 4: Write the failing smoke test**

`tests/e2e/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('health endpoint responds', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true, service: 'the-master-time' });
});
```
Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts`
Expected: FAIL with 404.

- [ ] **Step 5: Implement the health route**

`src/pages/api/health.ts`:
```ts
import type { APIRoute } from 'astro';
export const prerender = false;
export const GET: APIRoute = () => new Response(
  JSON.stringify({ ok: true, service: 'the-master-time' }),
  { headers: { 'Content-Type': 'application/json' } }
);
```

- [ ] **Step 6: Run the test and build**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts`
Expected: PASS.
Run: `npm run check && npm run lint && npm run test && npm run build`
Expected: all pass.

- [ ] **Step 7: Add CI**

`.github/workflows/ci.yml`: Node 22, `npm ci`, `npm run check`, `npm run lint`, `npm run test`, `npm run build`, `npx playwright install --with-deps chromium`, `npm run test:e2e`. Cache npm.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: scaffold astro app, tests and ci"
```

---

### Task 2: Content data, Zod schemas, validation

**Files:**
- Create: `src/lib/content/schemas.ts`, `src/lib/content/index.ts`, `src/data/site.ts`, `src/data/categories.ts`, `src/data/calculator.ts`, `src/data/pricing.ts`, `src/data/faq.ts`, `src/data/conditions.ts`, `scripts/validate-content.ts`, `tests/unit/content.test.ts`.
- Modify: `package.json` — `build` becomes `npm run validate:content && astro build`; add `"validate:content": "tsx scripts/validate-content.ts"`.

**Interfaces:**
- Produces types: `SiteConfig`, `Category`, `Work`, `CalculatorTask`, `PricingConfig`, `FaqItem`, `Condition`.
- Produces constants: `site`, `categories`, `calculatorTasks`, `pricing`, `faqs`, `conditions`.
- Produces functions: `loadContent()`, `parseContent(raw)`, `getCategoryBySlug(slug)`, `getWorkById(category, workId)`, `getCalculatorTasksByCategory(slug)`, `getPopularWorks(limit?)`.
- Produces `ContentValidationError` with `issues: string[]`.

- [ ] **Step 1: Write failing schema tests**

`tests/unit/content.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { CategorySchema } from '@/lib/content/schemas';
import { loadContent, parseContent, getCategoryBySlug, getPopularWorks, ContentValidationError } from '@/lib/content';
import { siteData } from '@/data/site';
import { pricingData } from '@/data/pricing';

describe('content', () => {
  it('loads six categories with expected slugs', () => {
    const { categories } = loadContent();
    expect(categories.map((c) => c.slug)).toEqual([
      'santehnika', 'elektrika', 'remont-otdelka',
      'mebel', 'bytovaya-tehnika', 'melkie-raboty'
    ]);
  });

  it('finds a category by slug', () => {
    expect(getCategoryBySlug('santehnika')?.title).toBe('Сантехника');
  });

  it('returns six popular works', () => {
    expect(getPopularWorks(6)).toHaveLength(6);
  });

  it('rejects a bad slug', () => {
    const result = CategorySchema.safeParse({
      slug: 'Bad Slug', title: 'X', shortTitle: 'X', icon: 'x',
      description: 'X', seo: { title: 'X', description: 'X' },
      works: [{ id: 'w', title: 'W', priceFrom: 10 }], faq: []
    });
    expect(result.success).toBe(false);
  });

  it('rejects duplicate work ids across categories', () => {
    const category = {
      slug: 'a', title: 'A', shortTitle: 'A', icon: 'a',
      description: 'A', seo: { title: 'A', description: 'A' },
      works: [{ id: 'same', title: 'W', priceFrom: 10 }], faq: []
    };
    const raw = {
      site: siteData,
      categories: [category, { ...category, slug: 'b', title: 'B', shortTitle: 'B' }],
      calculatorTasks: [], pricing: pricingData, faqs: [], conditions: []
    };
    expect(() => parseContent(raw)).toThrow(ContentValidationError);
  });
});
```
Import `parseContent`, `siteData`, `pricingData` in the test. `parseContent(raw)` is exported for tests.

Run: `npm run test -- tests/unit/content.test.ts`
Expected: FAIL (modules missing).

- [ ] **Step 2: Define schemas**

`src/lib/content/schemas.ts` with Zod:
- `WorkSchema`: `id`, `title`, `priceFrom` (nonnegative int), `priceTo?`, `unit` enum `['работа','час','м2','точка']` default `'работа'`, `duration?`, `description?`, `includes` default `[]`, `notes?`, `popular` default `false`.
- `FaqItemSchema`: `question`, `answer`.
- `SeoSchema`: `title`, `description`.
- `CategorySchema`: `slug` regex `/^[a-z0-9-]+$/`, `title`, `shortTitle`, `icon`, `description`, `seo`, `works` min 1, `faq` default `[]`.
- `CalculatorTaskSchema`: `id`, `categorySlug`, `label`, `workId`, optional `priceFrom`/`priceTo`/`duration`/`hint`.
- `PricingConfigSchema`: `currency` literal `'BYN'`, `minOrder`, `urgentSurchargePercent`, `outOfTownFee`, `outOfTownRadiusKm`, `diagnosticsFee`, `diagnosticsWaivedOnWork` default true, `disclaimer`.
- `ConditionSchema`: `title`, `body`.
- `SiteConfigSchema`: `brand` literal `'The Master Time'`, `legalName`, `unp`, `phoneDisplay`, `phoneLink` regex `/^\+375\d{9}$/`, `email` email, `instagramUrl` url, `instagramDm` url, `viberUrl` min 1, `areaServed`, `workingHours`, `copyright`, `defaultSeo`.

Export inferred types.

- [ ] **Step 3: Add demo data**

`src/data/site.ts`:
```ts
export const siteData = {
  brand: 'The Master Time',
  legalName: 'Янковский В.В.',
  unp: '56723984',
  phoneDisplay: '+375 25 707-67-93',
  phoneLink: '+375257076793',
  email: 'site@example.com', // demo
  instagramUrl: 'https://www.instagram.com/the_master.time/',
  instagramDm: 'https://ig.me/m/the_master.time',
  viberUrl: 'viber://chat?number=%2B375257076793',
  areaServed: 'Гродно и до 20 км',
  workingHours: 'Ежедневно 8:00–21:00', // demo
  copyright: 'The Master Time · Янковский В.В. · УНП 56723984 · 2025–2026',
  defaultSeo: {
    title: 'Мастер на час в Гродно — The Master Time',
    description: 'Услуги мастера на час в Гродно: сантехника, электрика, ремонт, мебель, техника. Прозрачные цены, быстрый выезд.'
  }
};
```

`src/data/categories.ts` — six categories with these slugs/titles:
`santehnika` Сантехника, `elektrika` Электрика, `remont-otdelka` Ремонт и отделка, `mebel` Мебельные работы, `bytovaya-tehnika` Бытовая техника, `melkie-raboty` Мелкие работы.

Минимальный демо-набор (3 работы на категорию, цены `// demo`):

| Категория | Работа | id | от | до | Время |
|---|---|---|---|---|---|
| Сантехника | Замена смесителя | `zamena-smesitelya` | 40 | 60 | 30–60 мин |
| Сантехника | Устранение течи крана | `ustranenie-techi` | 30 | 50 | 30–60 мин |
| Сантехника | Установка унитаза | `ustanovka-unitaza` | 80 | 120 | 1–2 ч |
| Электрика | Замена розетки | `zamena-rozetki` | 30 | 50 | 20–40 мин |
| Электрика | Установка светильника | `ustanovka-svetilnika` | 40 | 80 | 30–60 мин |
| Электрика | Монтаж автомата | `montazh-avtomata` | 50 | 90 | 30–60 мин |
| Ремонт и отделка | Мелкий ремонт стены | `melkiy-remont-steny` | 50 | 100 | 1–2 ч |
| Ремонт и отделка | Установка листа гипсокартона | `ustanovka-gipsokartona` | 60 | 100 | 1–2 ч |
| Ремонт и отделка | Укладка плитки (м²) | `ukladka-plitki` | 25 | 40 | 1 м² |
| Мебельные работы | Сборка шкафа | `sborka-shkafa` | 60 | 120 | 1–3 ч |
| Мебельные работы | Ремонт мебели | `remont-mebeli` | 40 | 80 | 1–2 ч |
| Мебельные работы | Установка фурнитуры | `ustanovka-furnitury` | 30 | 60 | 30–60 мин |
| Бытовая техника | Ремонт стиральной машины | `remont-stiralnoy-mashiny` | 60 | 120 | 1–2 ч |
| Бытовая техника | Ремонт холодильника | `remont-holodilnika` | 80 | 150 | 1–2 ч |
| Бытовая техника | Установка плиты | `ustanovka-plitty` | 60 | 100 | 1–2 ч |
| Мелкие работы | Повесить полку | `povesit-polku` | 30 | 50 | 20–40 мин |
| Мелкие работы | Повесить карниз | `povesit-karniz` | 40 | 60 | 30–60 мин |
| Мелкие работы | Сборка комода | `sborka-komoda` | 50 | 90 | 1–2 ч |

Mark six works `popular: true`: `zamena-smesitelya`, `zamena-rozetki`, `sborka-shkafa`, `remont-stiralnoy-mashiny`, `povesit-polku`, `melkiy-remont-steny`.

`src/data/calculator.ts` — 2–3 задачи на категорию; `santehnika` обязательно:
`zamena-smesitelya` → `zamena-smesitelya`, `ustranenie-techi` → `ustranenie-techi`, `ustanovka-unitaza` → `ustanovka-unitaza`.
Остальные категории — по 2 задачи, ссылающиеся на работы без `unit: 'м2'`/`'час'`.

`src/data/pricing.ts`:
```ts
export const pricingData = {
  currency: 'BYN',
  minOrder: 30,
  urgentSurchargePercent: 20,
  outOfTownFee: 20,
  outOfTownRadiusKm: 20,
  diagnosticsFee: 0,
  diagnosticsWaivedOnWork: true,
  disclaimer: 'Ориентировочно. Точную цену подтвержу после уточнения деталей.'
}; // demo values
```

`src/data/faq.ts` — 6 общих вопросов (выезд, цена, гарантия, оплата, срочность, загород). Первый вопрос — ровно `Сколько стоит выезд?` (на него опирается home E2E). Ответы без выдуманных гарантий: где нет данных — «уточним при заявке».
`src/data/conditions.ts` — 6–8 секций: выезд/диагностика, минимальный заказ, срочность, загород, материалы, оплата, гарантия, часы. Неизвестное — «уточняется».

- [ ] **Step 4: Implement loader and validation**

Use relative imports inside `src/lib/content/index.ts` and `scripts/validate-content.ts` (e.g. `../../data/categories`) so `tsx scripts/validate-content.ts` works without extra alias tooling. Components/tests can still import via `@/lib/content`.

`src/lib/content/index.ts`:
- `parseContent(raw)` parses each schema, collects Zod issues into `ContentValidationError.issues`.
- Checks unique category slugs, unique work IDs across all categories, unique calculator task IDs, and that every task references an existing category/work.
- `loadContent()` calls `parseContent` with the raw data.
- Exports `content` constant and the getter functions.
- `getPopularWorks(limit = 6)` returns `{ category, work }[]`, popular first, then others, limited.

- [ ] **Step 5: Implement validation script**

`scripts/validate-content.ts`: calls `loadContent()`, prints `Content OK: 6 categories, 18 works, N tasks.`; on `ContentValidationError` prints issues and exits 1.

- [ ] **Step 6: Run tests and build**

Run: `npm run test -- tests/unit/content.test.ts`
Expected: PASS.
Run: `npm run validate:content`
Expected: `Content OK: ...`.
Run: `npm run check && npm run build`
Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/content src/data scripts/validate-content.ts tests/unit/content.test.ts package.json
git commit -m "feat: add typed content data and build-time validation"
```

---

### Task 3: Shared utilities — phone, attribution, consent, analytics, SEO, JSON-LD

**Files:**
- Create: `src/lib/phone.ts`, `src/lib/attribution.ts`, `src/lib/consent.ts`, `src/lib/analytics.ts`, `src/lib/seo.ts`, `src/lib/jsonld.ts`, `tests/unit/phone.test.ts`, `tests/unit/attribution.test.ts`, `tests/unit/consent.test.ts`, `tests/unit/analytics.test.ts`, `tests/unit/seo.test.ts`, `tests/unit/jsonld.test.ts`.

**Interfaces:**
- `normalizeBelarusPhone(input: string): string | null`
- `formatBelarusPhone(input: string): string`
- `isValidBelarusPhone(input: string): boolean`
- `BY_MOBILE_CODES: readonly ['25','29','33','44']`
- `Attribution` fields: `utmSource?`, `utmMedium?`, `utmCampaign?`, `utmTerm?`, `utmContent?`, `gclid?`, `yclid?`, `referrer?`, `landingPage?`, `page?`, `device?`.
- `captureAttribution(search: string, referrer: string, landingPage: string, storage: Storage, now?: number): Attribution`
- `getAttribution(storage: Storage, page: string, device: 'mobile' | 'desktop', now?: number): Attribution`
- `CONSENT_KEY = 'tmt_consent'`; `getConsent(storage?): 'accepted' | 'declined' | null`; `setConsent(value, storage?)`.
- `track(event: string, params?: Record<string, unknown>, win?: AnalyticsWindow): void`
- `AnalyticsWindow` includes `dataLayer`, `ym?`, `gtag?`, `__tmtYmId?`.
- `SeoProps`: `title`, `description`, `canonical`, `image?`, `noindex?`, `type?`.
- `buildTitle(title: string): string`; `absoluteUrl(path: string, site: string): string`.
- `localBusinessJsonLd(site, categories)`, `serviceJsonLd(category, site, pricing)`, `faqJsonLd(items)`, `breadcrumbJsonLd(items, siteUrl)`.

- [ ] **Step 1: Write failing phone tests**

`tests/unit/phone.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { normalizeBelarusPhone, formatBelarusPhone, isValidBelarusPhone } from '@/lib/phone';

describe('phone', () => {
  it.each([
    ['+375291234567', '+375291234567'],
    ['375291234567', '+375291234567'],
    ['80291234567', '+375291234567'],
    ['8291234567', '+375291234567'],
    ['291234567', '+375291234567'],
    ['+375 29 123-45-67', '+375291234567']
  ])('normalizes %s', (input, expected) => {
    expect(normalizeBelarusPhone(input)).toBe(expected);
  });

  it('rejects wrong operator code', () => {
    expect(normalizeBelarusPhone('+375111234567')).toBeNull();
  });

  it('rejects short numbers', () => {
    expect(normalizeBelarusPhone('+37529123')).toBeNull();
  });

  it('formats partial input for the mask', () => {
    expect(formatBelarusPhone('291234567')).toBe('+375 29 123-45-67');
    expect(formatBelarusPhone('')).toBe('');
  });

  it('validates', () => {
    expect(isValidBelarusPhone('+375291234567')).toBe(true);
    expect(isValidBelarusPhone('+375111234567')).toBe(false);
  });
});
```

- [ ] **Step 2: Write failing attribution/consent/analytics/seo/jsonld tests**

Use a fake `Storage` helper. Key assertions:
- `captureAttribution('?utm_source=instagram&utm_medium=social&gclid=abc', 'https://google.com', '/uslugi/santehnika', storage)` stores and returns the fields.
- `getAttribution(storage, '/ceny', 'mobile')` returns the stored source plus `page: '/ceny'`, `device: 'mobile'`.
- Expired entry (30+ days) returns `{}`.
- Storage throwing on `getItem`/`setItem` does not throw.
- Consent default null; set/get works; storage failure returns null.
- `track('phone_click', { placement: 'header' }, fakeWin)` pushes to `dataLayer`, calls `ym` with `('112934654','reachGoal','phone_click',{placement:'header'})`, calls `gtag('event', ...)`.
- `track` does not throw when `ym`/`gtag` are missing.
- `buildTitle('Услуги')` → `'Услуги | The Master Time'`; `buildTitle('The Master Time — главная')` stays unchanged.
- `absoluteUrl('/uslugi', 'https://x.by')` → `'https://x.by/uslugi'`.
- `localBusinessJsonLd(site, categories)` has `@type: 'LocalBusiness'`, `telephone`, `areaServed`, `sameAs`.
- `serviceJsonLd(category, site, pricing)` has `offers.lowPrice` equal to the minimum work price (or `minOrder`).
- `faqJsonLd` and `breadcrumbJsonLd` shapes.

Run: `npm run test -- tests/unit/phone.test.ts tests/unit/attribution.test.ts tests/unit/consent.test.ts tests/unit/analytics.test.ts tests/unit/seo.test.ts tests/unit/jsonld.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement phone utilities**

Use the normalization rules from the spec. `formatBelarusPhone` strips non-digits, removes `375`/`80`/`8`, truncates to 9 national digits, and formats as `+375 XX XXX-XX-XX` with partial support. `isValidBelarusPhone` = normalize !== null.

- [ ] **Step 4: Implement attribution and consent**

`attribution.ts`: `ATTRIBUTION_KEY = 'tmt_attribution'`, `ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000`. Parse `URLSearchParams`; map `utm_*`, `gclid`, `yclid`; store JSON `{ ...attribution, expiresAt }`; if no new attribution, keep existing; if storage fails, return `{}`. `getAttribution` returns `{ ...stored, page, device }` or `{}` if expired/invalid.
`consent.ts`: `CONSENT_KEY = 'tmt_consent'`; safe get/set.

- [ ] **Step 5: Implement analytics, SEO, JSON-LD**

`analytics.ts`: `track` pushes `{ event, ...params }` to `win.dataLayer`, calls `win.ym(win.__tmtYmId, 'reachGoal', event, params)` if function, calls `win.gtag('event', event, params)` if function; wrap in try/catch.
`seo.ts`: `buildTitle` appends ` | The Master Time` unless the title already contains `The Master Time`; `absoluteUrl` uses `new URL(path, site).toString()`.
`jsonld.ts`: pure functions returning plain objects; use `site` values; `serviceJsonLd(category, site, pricing)` computes `lowPrice` as `Math.max(pricing.minOrder, Math.min(...category.works.map((w) => w.priceFrom)))` and includes `priceCurrency: 'BYN'`, `url`, `areaServed`.

- [ ] **Step 6: Run tests**

Run: `npm run test -- tests/unit/phone.test.ts tests/unit/attribution.test.ts tests/unit/consent.test.ts tests/unit/analytics.test.ts tests/unit/seo.test.ts tests/unit/jsonld.test.ts`
Expected: PASS.
Run: `npm run check && npm run build`
Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/phone.ts src/lib/attribution.ts src/lib/consent.ts src/lib/analytics.ts src/lib/seo.ts src/lib/jsonld.ts tests/unit
git commit -m "feat: add phone, attribution, consent, analytics and seo utilities"
```

---

### Task 4: Design system, base layout, header/footer, mobile menu

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/utilities.css`, `src/layouts/BaseLayout.astro`, `src/components/layout/Header.astro`, `Footer.astro`, `Container.astro`, `Section.astro`, `Breadcrumbs.astro`, `StickyCta.astro`, `src/components/ui/Button.astro`, `Icon.astro`, `Card.astro`, `Badge.astro`, `Accordion.astro`, `src/components/seo/Seo.astro`, `JsonLd.astro`, `src/scripts/mobile-menu.ts`, `tests/e2e/layout.spec.ts`.
- Modify: `src/pages/index.astro` — temporary page using `BaseLayout`.
- Copy: `assets/icons/*.svg` → `src/assets/icons/`; normalize monochrome icons to `currentColor`, keep brand icons.

**Interfaces:**
- `BaseLayout.astro` props: `{ seo: SeoProps; jsonLd?: unknown[]; noindex?: boolean }`.
- `Button.astro` props: `{ href?: string; variant?: 'primary'|'secondary'|'ghost'|'dark'; size?: 'md'|'lg'; type?: 'button'|'submit'; disabled?: boolean; icon?: string; iconPosition?: 'left'|'right'; ariaLabel?: string; class?: string }`.
- `Icon.astro` props: `{ name: string; size?: number; class?: string; title?: string }`.
- `Accordion.astro` props: `{ items: FaqItem[] }`.
- `Breadcrumbs.astro` props: `{ items: Array<{ label: string; href?: string }> }`.
- Produces: dark header with logo/nav/phone/CTA, footer with legal info, mobile menu, sticky mobile CTA, skip link, main landmark.

- [ ] **Step 1: Write failing layout E2E**

`tests/e2e/layout.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('header and footer render', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /The Master Time/i }).first()).toBeVisible();
  await expect(page.locator('a[href="tel:+375257076793"]').first()).toBeVisible();
  await expect(page.locator('a[href="/politika-konfidencialnosti"]').first()).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
});

test('mobile menu toggles', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: /меню/i });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('sticky CTA is mobile only', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.locator('[data-sticky-cta]')).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('[data-sticky-cta]')).toBeHidden();
});

test('no horizontal overflow', async ({ page }) => {
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  }
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:e2e -- tests/e2e/layout.spec.ts`
Expected: FAIL (header missing).

- [ ] **Step 3: Implement tokens and global styles**

`tokens.css` — exact values from the spec:
`--color-accent: #EA6249`, `--color-accent-strong: #C94A34`, `--color-accent-soft: #F9ECE7`, `--color-ink: #161312`, `--color-ink-soft: rgba(67,59,56,.95)`, `--color-text: #2B2523`, `--color-muted: #606060`, `--color-line: #E7E1DD`, `--color-surface: #FFFFFF`, `--color-surface-alt: #F6F6F6`, `--color-success: #2E7D32`, `--color-error: #C62828`, `--color-warning: #B26A00`, radii `8/12/20/28/999`, shadows, `--font-sans: 'Montserrat', Arial, sans-serif`, `--container: 1200px`, `--gutter: 20px`, `--section-y: 64px`, `--transition: 180ms ease`.

`global.css`:
- reset, `box-sizing`, `html` scroll-behavior, `body` font/background, `img` max-width, `a` color, headings, `:focus-visible` ring, `.skip-link`, `.container`, `.section`, `.sr-only`, `prefers-reduced-motion` block.
- Import `@fontsource/montserrat/300.css`, `400.css`, `500.css`, `700.css`, `900.css`.

`utilities.css` — grid helpers `.grid`, `.grid-2`, `.grid-3`, `.stack`, `.cluster`, `.flow`.

- [ ] **Step 4: Implement `Seo.astro` and `JsonLd.astro`**

`Seo.astro` renders `<title>`, meta description, canonical from `Astro.site`, OG/Twitter tags, optional `noindex`. `JsonLd.astro` renders one or more `<script type="application/ld+json" set:html={JSON.stringify(data)} />`.

- [ ] **Step 5: Implement layout components**

- `Container.astro`: `<div class="container"><slot /></div>`.
- `Section.astro`: `<section class:list={['section', className]} id={id}><slot /></section>` props `{ id?: string; className?: string }`.
- `Header.astro`: dark `<header>`; logo link to `/` using `Icon name="logo-mobile-white"` plus `<span class="sr-only">The Master Time</span>` for the accessible name; desktop nav with a native `<details class="nav-dropdown">` for «Услуги» (summary + list of six category links from `categories`), plus `Цены`, `Калькулятор`, `Отзывы`, `Контакты`; phone link; `<Button href="/kalkulyator" variant="primary">Рассчитать</Button>`; mobile menu button `aria-label="Открыть меню"` / `aria-expanded`; nav panel hidden by default. Add an E2E assertion: open the «Услуги» dropdown and see «Сантехника».
- `Footer.astro`: dark; logo, short text, categories links, pages links, contacts (phone, Instagram, Viber), legal line with УНП and privacy link.
- `StickyCta.astro`: `<div data-sticky-cta>` fixed bottom on mobile with `tel:` and `/kalkulyator`; hidden at `min-width: 768px`.
- `Breadcrumbs.astro`: `<nav aria-label="Хлебные крошки"><ol>...`.
- `Button.astro`: conditional `<a>`/`<button>`; classes `btn btn--primary|secondary|ghost|dark btn--md|lg`; icon via `Icon`; forwards `data-*` attributes (needed for analytics/lead dialog).
- `Icon.astro`: `import.meta.glob('/src/assets/icons/*.svg', { query: '?raw', import: 'default', eager: true })`; map by filename; render `<span class="icon" aria-hidden={title ? undefined : 'true'} set:html={svg} />`; if `title`, add `role="img"` and `aria-label`.
- `Card.astro`, `Badge.astro`: simple wrappers with slots/props.
- `Accordion.astro`: native `<details><summary>...</summary><div>...</div></details>` per item; no JS.

- [ ] **Step 6: Implement mobile menu**

`src/scripts/mobile-menu.ts`: on DOMContentLoaded, find `[data-menu-toggle]` and `[data-menu]`; toggle `hidden`, `aria-expanded`, `aria-label`; close on Escape, outside click, and link click; no focus trap (dropdown, not modal).

- [ ] **Step 7: Wire `BaseLayout` and temporary home**

`BaseLayout.astro`: `<html lang="ru">`, `<head>` with `Seo`, `<JsonLd>`, viewport, theme-color; `<body><a class="skip-link" href="#main">К содержанию</a><Header /><main id="main"><slot /></main><Footer /><StickyCta /><slot name="scripts" /></body>`.
Temporary `src/pages/index.astro` uses `BaseLayout` with `seo` from `site.defaultSeo` and an `<h1>The Master Time</h1>`.

- [ ] **Step 8: Run tests and build**

Run: `npm run test:e2e -- tests/e2e/layout.spec.ts`
Expected: PASS.
Run: `npm run check && npm run lint && npm run build`
Expected: pass.

- [ ] **Step 9: Commit**

```bash
git add src/styles src/layouts src/components src/scripts/mobile-menu.ts src/assets/icons src/pages/index.astro tests/e2e/layout.spec.ts
git commit -m "feat: add responsive design system, layout and navigation"
```

---

### Task 5: Pricing engine

**Files:**
- Create: `src/lib/pricing/types.ts`, `src/lib/pricing/calculate.ts`, `src/lib/pricing/format.ts`, `tests/unit/pricing.test.ts`, `tests/unit/pricing-format.test.ts`.

**Interfaces:**
- Types: `Urgency = 'asap' | 'this_week' | 'flexible'`, `Location = 'city' | 'out_of_town' | 'beyond'`.
- `EstimateLine { label: string; from: number; to?: number }`.
- `Estimate { currency: 'BYN'; from: number; to?: number; isRange: boolean; requiresPhone: boolean; minOrderApplied: boolean; duration?: string; lines: EstimateLine[]; notice?: string; disclaimer: string }`.
- `EstimateInput { task: CalculatorTask; work: Work; pricing: PricingConfig; urgency: Urgency; location: Location }`.
- `calculateEstimate(input: EstimateInput): Estimate`.
- `formatPrice(value: number): string`; `formatRange(from: number, to?: number): string`; `getCategoryPriceFrom(category: Category, pricing: PricingConfig): number`.

- [ ] **Step 1: Write failing engine tests**

`tests/unit/pricing.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { calculateEstimate } from '@/lib/pricing/calculate';

const pricing = {
  currency: 'BYN', minOrder: 30, urgentSurchargePercent: 20,
  outOfTownFee: 20, outOfTownRadiusKm: 20, diagnosticsFee: 0,
  diagnosticsWaivedOnWork: true, disclaimer: 'Ориентировочно.'
};
const work = { id: 'w', title: 'W', priceFrom: 40, priceTo: 60, unit: 'работа' as const, includes: [], popular: false };
const task = { id: 't', categorySlug: 's', label: 'T', workId: 'w' };

describe('calculateEstimate', () => {
  it('returns base range', () => {
    const e = calculateEstimate({ task, work, pricing, urgency: 'this_week', location: 'city' });
    expect(e).toMatchObject({ from: 40, to: 60, isRange: true, requiresPhone: false, minOrderApplied: false });
  });

  it('applies urgent 20% to both bounds', () => {
    const e = calculateEstimate({ task, work, pricing, urgency: 'asap', location: 'city' });
    expect(e).toMatchObject({ from: 48, to: 72 });
  });

  it('adds out-of-town fee', () => {
    const e = calculateEstimate({ task, work, pricing, urgency: 'asap', location: 'out_of_town' });
    expect(e).toMatchObject({ from: 68, to: 92 });
  });

  it('keeps only "from" when no priceTo', () => {
    const e = calculateEstimate({ task, work: { ...work, priceTo: undefined }, pricing, urgency: 'asap', location: 'city' });
    expect(e.from).toBe(48);
    expect(e.to).toBeUndefined();
    expect(e.isRange).toBe(false);
  });

  it('clamps to min order after surcharges', () => {
    const e = calculateEstimate({ task, work: { ...work, priceFrom: 10, priceTo: 20 }, pricing, urgency: 'this_week', location: 'city' });
    expect(e).toMatchObject({ from: 30, to: 30, isRange: false, minOrderApplied: true });
  });

  it('adds diagnostics when not waived', () => {
    const e = calculateEstimate({ task, work, pricing: { ...pricing, diagnosticsFee: 20, diagnosticsWaivedOnWork: false }, urgency: 'this_week', location: 'city' });
    expect(e).toMatchObject({ from: 60, to: 80 });
  });

  it('requires phone beyond 20 km', () => {
    const e = calculateEstimate({ task, work, pricing, urgency: 'asap', location: 'beyond' });
    expect(e.requiresPhone).toBe(true);
    expect(e.notice).toContain('20 км');
  });

  it('rounds up', () => {
    const e = calculateEstimate({ task, work: { ...work, priceFrom: 33.33, priceTo: 44.44 }, pricing, urgency: 'asap', location: 'city' });
    expect(e).toMatchObject({ from: 40, to: 54 });
  });
});
```
`tests/unit/pricing-format.test.ts`: `formatPrice(40) === '40 BYN'`, `formatRange(40, 60) === '40–60 BYN'`, `formatRange(40) === 'от 40 BYN'`, `getCategoryPriceFrom` floors at `minOrder`.

- [ ] **Step 2: Run and verify failure**

Run: `npm run test -- tests/unit/pricing.test.ts tests/unit/pricing-format.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement engine**

Order: base from task override or work; if `location === 'beyond'` return base with `requiresPhone: true`, `notice` and no surcharges; apply urgent percent; add out-of-town fee; apply min order to both bounds; add diagnostics if not waived (line with amount 0 if waived); round both bounds up with `Math.ceil`; `isRange = to !== undefined && to !== from`; build `lines`:
- `{ label: 'Работа', from: baseFrom, to: baseTo }`
- `{ label: 'Срочность', from: urgentDeltaFrom, to: urgentDeltaTo }` if urgent
- `{ label: 'За городом', from: fee, to: fee }` if out_of_town
- `{ label: 'Диагностика', from: fee, to: fee }` if fee > 0
- `{ label: 'Диагностика (зачитывается)', from: 0, to: 0 }` if waived and `diagnosticsFee > 0`; if `diagnosticsFee === 0`, omit or show 0 — choose omit.
`minOrderApplied` when `Math.max(minOrder, from)` changed either bound.
`duration` from task override or work.

- [ ] **Step 4: Implement formatters**

`formatPrice` uses `Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })` + ` BYN`. `formatRange` returns `от X BYN` when no `to` or equal, otherwise `X–Y BYN`. `getCategoryPriceFrom` as defined.

- [ ] **Step 5: Run tests**

Run: `npm run test -- tests/unit/pricing.test.ts tests/unit/pricing-format.test.ts`
Expected: PASS.
Run: `npm run check && npm run build`
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pricing tests/unit/pricing.test.ts tests/unit/pricing-format.test.ts
git commit -m "feat: add transparent pricing and estimate engine"
```

---

### Task 6: Lead validation, formatting, email notifier

**Files:**
- Create: `src/lib/leads/types.ts`, `src/lib/leads/validate.ts`, `src/lib/leads/format.ts`, `src/lib/leads/email.ts`, `src/lib/photo-limits.ts`, `tests/unit/leads-validate.test.ts`, `tests/unit/leads-format.test.ts`, `tests/unit/leads-email.test.ts`, `tests/unit/photo-limits.test.ts`.

**Interfaces:**
- `LeadSource = 'form' | 'calculator' | 'callback'`.
- `LeadPhoto { filename: string; contentType: string; size: number; content: Buffer }`.
- `LeadInput { name?: string; phone: string; message?: string; categorySlug?: string; taskId?: string; urgency?: Urgency; location?: Location; estimateFrom?: number; estimateTo?: number; source: LeadSource; page: string; attribution: Attribution; consent: boolean; photos: LeadPhoto[] }`.
- `Lead extends LeadInput { id: string; createdAt: string }`.
- `LeadNotifier { name: string; send(lead: Lead): Promise<void> }`.
- `LeadParseResult = { ok: true; input: LeadInput } | { ok: false; errors: Record<string, string> }`.
- `parseLeadFormData(formData: FormData, opts?: { now?: number }): Promise<LeadParseResult>`.
- `formatLeadText(lead: Lead): string`; `formatLeadHtml(lead: Lead): string`; `escapeHtml(value: string): string`.
- `EmailConfig { host: string; port: number; user: string; pass: string; from: string; to: string }`.
- `createSmtpTransport(config: EmailConfig): { sendMail(message: unknown): Promise<unknown> }` — reusable by future notification channels.
- `createEmailNotifier(config: EmailConfig, sendMail?: (message: unknown) => Promise<unknown>): LeadNotifier`.
- `PhotoLimits { maxFiles: number; maxFileSize: number; maxTotalSize: number; allowedTypes: readonly string[] }`.
- `CLIENT_PHOTO_LIMITS`: 3 files, 12 МБ each, 30 МБ total, JPEG/PNG/WebP/HEIC/HEIF.
- `SERVER_PHOTO_LIMITS`: 3 files, 4 МБ each, 10 МБ total, JPEG/PNG/WebP.
- `validatePhotoFiles(files: Array<{ type: string; size: number; name: string }>, limits: PhotoLimits): string | null`.

- [ ] **Step 1: Write failing validation tests**

`tests/unit/leads-validate.test.ts`:
- Helper `validForm()` returns a `FormData` with `phone: '+375 29 123-45-67'`, `name: 'Иван'`, `source: 'form'`, `page: '/kalkulyator'`, `consent: '1'`, `startedAt: String(Date.now() - 5000)`, `website: ''`.
- Cases: valid → `ok: true`, phone normalized `+375291234567`; missing phone → error `phone`; invalid code `+375111234567` → error; missing consent → error; honeypot filled → error `website`; `startedAt` 1s ago → error; 4 photos → error `photos`; non-image file → error; 5MB file → error; invalid attribution JSON → attribution `{}`; name 100 chars → error.
- `tests/unit/photo-limits.test.ts`: server limits reject HEIC, 5MB, 4 files, total >10MB; client limits accept HEIC and 5MB (will be compressed), reject 13MB and 4 files.
- Run: `npm run test -- tests/unit/leads-validate.test.ts tests/unit/photo-limits.test.ts` → FAIL.

- [ ] **Step 2: Write failing formatting/email tests**

`leads-format.test.ts`: lead with name `<script>` and message `"Течёт кран"`; `formatLeadHtml` does not contain `<script>` and contains `&lt;script&gt;`; text contains phone/source/estimate. `leads-email.test.ts`: fake `sendMail` receives `to`, `from`, `subject` with `Заявка`, `attachments` length 1 for one photo; `contentType` preserved.

- [ ] **Step 3: Implement validation**

`parseLeadFormData`:
- Read strings with helper `field(name)`.
- Validate `name` max 80, `message` max 1000, `page` max 200, `source` enum, `consent` truthy, `website` empty, `startedAt` (if present) older than 3000ms.
- Parse `attribution` JSON; if invalid, `{}`; cap 2000 chars.
- Validate photos with `validatePhotoFiles(files, SERVER_PHOTO_LIMITS)` (3 files, 4 МБ each, 10 МБ total, JPEG/PNG/WebP); convert `File` to `LeadPhoto` with `Buffer.from(await file.arrayBuffer())`.
- Phone: `normalizeBelarusPhone`; if null, error.
- Return errors keyed by field; no exceptions.

- [ ] **Step 4: Implement formatting and email**

`formatLeadText`/`formatLeadHtml` include: ID, date (Minsk), name, phone, source, page, category/task, urgency/location, estimate range, message, attribution fields, photo count. Escape all user strings in HTML.
`createSmtpTransport`: `nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })`, returns `{ sendMail: (message) => transport.sendMail(message) }`.
`createEmailNotifier`: default `sendMail` = `createSmtpTransport(config).sendMail`; `send` calls it with `from`, `to`, `subject: \`[The Master Time] Новая заявка: ${lead.phone}\``, `text`, `html`, `attachments` mapping photos `{ filename, content, contentType }`; resolve on success, throw on error.

- [ ] **Step 5: Run tests**

Run: `npm run test -- tests/unit/leads-validate.test.ts tests/unit/leads-format.test.ts tests/unit/leads-email.test.ts`
Expected: PASS.
Run: `npm run check && npm run build`
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/leads tests/unit/leads-validate.test.ts tests/unit/leads-format.test.ts tests/unit/leads-email.test.ts
git commit -m "feat: add lead validation, formatting and email notifier"
```

---

### Task 7: Viber notifier, delivery fan-out, rate limit, lead API, Viber webhook

**Files:**
- Create: `src/lib/leads/viber.ts`, `notify.ts`, `rate-limit.ts`, `handle.ts`, `test-notifier.ts`, `src/lib/env.ts`, `src/pages/api/lead.ts`, `src/pages/api/viber/webhook.ts`, `tests/unit/leads-viber.test.ts`, `tests/unit/leads-notify.test.ts`, `tests/unit/rate-limit.test.ts`, `tests/unit/leads-handle.test.ts`, `tests/unit/viber-webhook.test.ts`.

**Interfaces:**
- `ViberConfig { token: string; adminId: string }`.
- `sendViberText(config: ViberConfig, text: string, fetchImpl?: typeof fetch): Promise<void>` — reusable by future notification channels.
- `createViberNotifier(config: ViberConfig, fetchImpl?: typeof fetch): LeadNotifier | null`.
- `notifyLead(lead: Lead, notifiers: LeadNotifier[]): Promise<{ delivered: boolean; results: Array<{ name: string; ok: boolean; error?: string }> }>`.
- `createRateLimiter(options: { windowMs: number; max: number; now?: () => number }): { check(key: string): boolean }`.
- `handleLead(input: { formData: FormData; ip: string; userAgent: string; referer: string; wantsJson: boolean }, deps: { notifiers: LeadNotifier[]; rateLimiter: ReturnType<typeof createRateLimiter>; now?: () => Date }): Promise<{ status: number; body: unknown; redirect?: string }>`.
- `createNotifiers(config: { testMode: boolean; email: EmailConfig | null; viber: ViberConfig | null }): LeadNotifier[]`.
- `getLeadConfig(): { testMode: boolean; email: EmailConfig | null; viber: ViberConfig | null }` — reads env, returns nulls instead of throwing at build.
- `verifyViberSignature(rawBody: string, signature: string | null, token: string): boolean`.
- `GET/POST /api/lead` JSON responses `{ ok: true, leadId }` / `{ ok: false, error, fields? }`; native form success → 303 `/spasibo?source=form`; native error → 400 HTML page with phone/Viber.

- [ ] **Step 1: Write failing Viber/notify/rate-limit tests**

`leads-viber.test.ts`:
- With fake fetch, `send` posts to `https://chatapi.viber.com/pa/send_message`, header `X-Viber-Auth-Token`, body `{ receiver: adminId, type: 'text', text: expect.stringContaining('+375...') }`.
- Missing token/admin → `null`.
- Fetch non-200 → rejects.

`leads-notify.test.ts`:
- success/email-fail/viber-success → delivered true; both fail → false; empty notifiers → false.

`rate-limit.test.ts`:
- max 2 per 60s; third call false; after 61s true again (inject `now`).

- [ ] **Step 2: Write failing handler tests**

`leads-handle.test.ts`:
- Valid form + fake success notifier → 200, body `{ ok: true, leadId }`.
- Invalid phone → 400 with `fields.phone`.
- Rate limit exceeded → 429.
- Both notifiers fail → 502.
- `wantsJson: false` + success → 303 redirect `/spasibo?source=form`.
- `wantsJson: false` + failure → 400 and body HTML containing `tel:+375257076793`.
- Category/task reference unknown → 400 `fields.categorySlug` / `fields.taskId`.
Run: `npm run test -- tests/unit/leads-handle.test.ts`.
Expected: FAIL.

- [ ] **Step 3: Implement Viber, notify, rate limit**

`viber.ts`: return `null` if `!token || !adminId`; `send` fetches the API; on non-2xx throw with status; message text includes name/phone/source/estimate/page; no photos (email has them).
`notify.ts`: `Promise.allSettled`, map results, `delivered = some(ok)`. `createNotifiers`: if `testMode`, return `[createTestNotifier()]`; else include email if config, Viber if non-null; filter.
`rate-limit.ts`: `Map<string, number[]>`; prune old timestamps; `check` returns false if count >= max; push now if allowed.

- [ ] **Step 4: Implement `handleLead`**

- Rate limit key = IP; return 429 if false.
- `parseLeadFormData`; on errors return 400 `{ ok:false, error:'validation', fields }` (or HTML for native).
- If `categorySlug`/`taskId` provided, check against `loadContent()`; invalid → 400.
- Build `Lead` with `id = crypto.randomUUID()`, `createdAt = now().toISOString()`.
- `notifyLead`; if delivered → 200 `{ ok:true, leadId }` or 303 redirect; else 502 `{ ok:false, error:'delivery_failed' }` or HTML error with phone/Viber.
- For native HTML error, return a minimal HTML string with `<a href="tel:+375257076793">` and `<a href="viber://chat?number=%2B375257076793">`.

- [ ] **Step 5: Implement API routes**

`src/pages/api/lead.ts`:
- `export const prerender = false`.
- `POST`: compute IP from `x-forwarded-for` or `clientAddress`; `wantsJson = accept includes application/json || x-requested-with === 'fetch'`; `const formData = await request.formData()`; `handleLead` with `createNotifiers(getLeadConfig())`; if `redirect` return 303 with `Location`; else JSON/HTML response.
- `src/lib/env.ts`: read `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO`, `VIBER_AUTH_TOKEN`, `VIBER_ADMIN_ID`, `LEAD_TEST_MODE`. Export `getLeadConfig()`; do not throw at build, return nulls if missing.

`src/pages/api/viber/webhook.ts`:
- `export const prerender = false`.
- `POST`: raw = await request.text(); verify HMAC SHA256 with `VIBER_AUTH_TOKEN` and `x-viber-content-signature`; 401 if invalid; parse JSON; `console.log('[viber] sender', event.sender?.id, event.sender?.name)`; return `{ status: 0 }`.

- [ ] **Step 6: Implement signature helper and test**

`verifyViberSignature` uses `crypto.createHmac('sha256', token).update(rawBody).digest('hex')`; compare with `timingSafeEqual`. Test true/false.

- [ ] **Step 7: Run tests**

Run: `npm run test -- tests/unit/leads-viber.test.ts tests/unit/leads-notify.test.ts tests/unit/rate-limit.test.ts tests/unit/leads-handle.test.ts tests/unit/viber-webhook.test.ts`
Expected: PASS.
Run: `npm run check && npm run build`
Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/leads src/lib/env.ts src/pages/api/lead.ts src/pages/api/viber tests/unit
git commit -m "feat: add lead api with email and viber delivery"
```

---

### Task 8: Home page

**Files:**
- Create: `src/components/marketing/Hero.astro`, `TrustBar.astro`, `ServiceGrid.astro`, `ServiceCard.astro`, `PriceTable.astro`, `PriceRow.astro`, `HowItWorks.astro`, `InstagramBlock.astro`, `Faq.astro`, `ContactBlock.astro`, `CtaBand.astro`; `tests/e2e/home.spec.ts`.
- Modify: `src/pages/index.astro`.

**Interfaces:**
- `Hero.astro` props `{ title: string; subtitle: string; intro?: string }`.
- `ServiceGrid.astro` props `{ categories: Category[]; pricing: PricingConfig }`.
- `ServiceCard.astro` props `{ category: Category; priceFrom: number }`.
- `PriceTable.astro` props `{ works: Work[]; pricing: PricingConfig }`.
- `PriceRow.astro` props `{ work: Work; pricing: PricingConfig }`.
- `Faq.astro` props `{ items: FaqItem[]; title?: string }`.
- `CtaBand.astro` props `{ title: string; text?: string; primaryHref?: string; primaryLabel?: string }`.
- `ContactBlock.astro` no props (uses `site`).
- `InstagramBlock.astro` no props (uses `site`).

- [ ] **Step 1: Write failing home E2E**

`tests/e2e/home.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('home sells the service', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Мастер на час в Гродно');
  await expect(page.locator('[data-service-card]')).toHaveCount(6);
  await expect(page.getByText('Замена смесителя')).toBeVisible();
  await expect(page.getByText('40 BYN').first()).toBeVisible();
  await expect(page.locator('a[href="/kalkulyator"]').first()).toBeVisible();
  await expect(page.locator('a[href="https://ig.me/m/the_master.time"]').first()).toBeVisible();
  await expect(page.locator('a[href^="viber://chat"]').first()).toBeVisible();
});

test('faq opens', async ({ page }) => {
  await page.goto('/');
  const faq = page.getByText('Сколько стоит выезд?');
  await faq.click();
  await expect(page.getByText(/выезд/i).first()).toBeVisible();
});

test('home has json-ld and no overflow', async ({ page }) => {
  await page.goto('/');
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(ld!)).toMatchObject({ '@type': 'LocalBusiness' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `npm run test:e2e -- tests/e2e/home.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implement marketing components**

- `Hero`: dark section, eyebrow «Мастер на час · Гродно», H1, subtitle, intro, CTA `Рассчитать стоимость` → `/kalkulyator`, secondary `Позвонить` → `tel:+375257076793`; trust chips «Выезд до 20 км», «Цена до начала работ», «Оплата после работы» (only if confirmed; otherwise use neutral «Прозрачные цены», «Быстрый выезд», «Гарантия — уточняется»? Use `TrustBar` with three items from `site`/conditions; mark demo).
- `TrustBar`: three items with check icons.
- `ServiceGrid`/`ServiceCard`: 6 cards, icon, title, `от {formatPrice(getCategoryPriceFrom(...))}`, link `/uslugi/{slug}`; `data-service-card`.
- `PriceTable`/`PriceRow`: popular works; each row title, price range, duration, link to category; responsive table/cards.
- `HowItWorks`: 3 steps 01/02/03.
- `InstagramBlock`: dark/peach card, heading «Сфотографируй проблему — пришли в директ», text about personal estimate and subscriber priority, buttons `Подписаться` → `site.instagramUrl`, `Отправить фото` → `site.instagramDm`, `data-track` attributes. If 2–3 real work photos are provided, show them; otherwise use a clean graphic block — no fake photos.
- `Faq`: `Accordion` with general FAQs.
- `ContactBlock`: phone, Viber, Instagram, area, hours, link `/zayavka` (if exists later; use `/kalkulyator` for now or `tel:`).
- `CtaBand`: dark band with «Не знаете, сколько будет стоить?» + `Рассчитать` and `Позвонить`.

- [ ] **Step 4: Build the home page**

`src/pages/index.astro`:
- `const { categories, pricing, faqs } = loadContent();`
- `const popular = getPopularWorks(6);`
- `seo` from `site.defaultSeo`; `jsonLd = [localBusinessJsonLd(site, categories), faqJsonLd(faqs)]`.
- Sections in order: Hero + TrustBar, ServiceGrid, calculator CTA (link + 3 steps), PriceTable, HowItWorks, InstagramBlock, Faq, ContactBlock, CtaBand.
- Each section has an `id` for anchors.

- [ ] **Step 5: Run tests**

Run: `npm run test:e2e -- tests/e2e/home.spec.ts`
Expected: PASS.
Run: `npm run check && npm run lint && npm run test && npm run build`
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/marketing src/pages/index.astro tests/e2e/home.spec.ts
git commit -m "feat: build the home page and marketing sections"
```

---

### Task 9: Catalog and category pages

**Files:**
- Create: `src/pages/uslugi/index.astro`, `src/pages/uslugi/[slug].astro`, `tests/e2e/catalog.spec.ts`.
- Reuse: `ServiceGrid`, `PriceTable`, `Breadcrumbs`, `Faq`, `CtaBand`.

**Interfaces:**
- `getStaticPaths()` returns `{ params: { slug }, props: { category } }` for six categories.
- Category H1: `${category.title} в Гродно`.
- Calculator link: `/kalkulyator?category=${category.slug}`.

- [ ] **Step 1: Write failing catalog E2E**

`tests/e2e/catalog.spec.ts`:
- `/uslugi` H1 «Услуги», 6 service cards.
- `/uslugi/santehnika` H1 «Сантехника в Гродно», «Замена смесителя», «40 BYN», link `/kalkulyator?category=santehnika`, breadcrumbs «Главная / Услуги / Сантехника», JSON-LD `Service`.
- `/uslugi/unknown` returns 404.
Run → FAIL.

- [ ] **Step 2: Implement catalog index**

`src/pages/uslugi/index.astro`: `BaseLayout` with `site.defaultSeo` + title «Услуги мастера на час в Гродно»; breadcrumbs; intro; `ServiceGrid`; `CtaBand`.

- [ ] **Step 3: Implement category page**

`src/pages/uslugi/[slug].astro`:
- `getStaticPaths` from categories.
- `BaseLayout` with `seo: category.seo`; `jsonLd = [serviceJsonLd(category, site, pricing), breadcrumbJsonLd([...], Astro.site?.toString() ?? ''), faqJsonLd(category.faq)]`. (`breadcrumbJsonLd` takes a string origin, not the `SiteConfig` object.)
- Hero with H1, description, CTA `Рассчитать`, `Позвонить` and `Отправить фото в Instagram` (`site.instagramDm`).
- `PriceTable` with `category.works`.
- «Что влияет на цену» list (materials, complexity, urgency, out-of-town).
- `Faq` if `category.faq.length`.
- `CtaBand`.
- `Breadcrumbs`.

- [ ] **Step 4: Run tests and build**

Run: `npm run test:e2e -- tests/e2e/catalog.spec.ts`
Expected: PASS.
Run: `npm run check && npm run lint && npm run build`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/uslugi tests/e2e/catalog.spec.ts
git commit -m "feat: add services catalog and category pages"
```

---

### Task 10: Price page with search and category filter

**Files:**
- Create: `src/pages/ceny.astro`, `src/scripts/price-filter.ts`, `tests/e2e/prices.spec.ts`.

**Interfaces:**
- Server renders all categories/works with `data-category-slug` on groups and `data-work-search` (lowercase title + description) on rows/cards.
- Client filter: `input[data-price-search]`, `select[data-price-category]`, `[data-price-empty]`, `[data-price-count]`.

- [ ] **Step 1: Write failing prices E2E**

`tests/e2e/prices.spec.ts`:
- Page H1 «Цены».
- All six category headings visible.
- Search «смеситель» → only «Замена смесителя» visible; count text contains `1`.
- Clear search → all visible.
- Select «Электрика» → only electrical works visible.
- Search «нет такого» → empty message visible.
Run → FAIL.

- [ ] **Step 2: Implement page**

`src/pages/ceny.astro`: `BaseLayout` with SEO title «Цены на услуги мастера в Гродно»; intro + disclaimer; filter form (search input, category select, reset button); groups per category with heading and `PriceTable`/rows; `data-price-empty` hidden message; `data-price-count`; JSON-LD maybe `OfferCatalog` optional (skip if not needed). Include `CtaBand`.

- [ ] **Step 3: Implement filter script**

`src/scripts/price-filter.ts`: on input/change, lowercase query, hide groups/rows by `data-work-search`/`data-category-slug`; update count (`N работ`), toggle empty message; no URL state required. Use `hidden` attribute.

- [ ] **Step 4: Run tests**

Run: `npm run test:e2e -- tests/e2e/prices.spec.ts`
Expected: PASS.
Run: `npm run check && npm run build`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ceny.astro src/scripts/price-filter.ts tests/e2e/prices.spec.ts
git commit -m "feat: add searchable price page"
```

---

### Task 11: Short lead form, dialog, photo compression, `/zayavka` fallback

**Files:**
- Create: `src/components/forms/LeadForm.astro`, `LeadFormDialog.astro`, `PhotoUpload.astro`, `ConsentField.astro`, `src/components/ui/Field.astro`, `PhoneField.astro`, `Checkbox.astro`, `Spinner.astro`, `InlineStatus.astro`, `src/lib/photo.ts`, `src/scripts/lead-form.ts`, `src/pages/zayavka.astro`, `tests/unit/photo.test.ts`, `tests/e2e/lead-form.spec.ts`.
- Modify: `src/components/marketing/ContactBlock.astro` and `CtaBand.astro` to add triggers. Triggers are `<a href="/zayavka" data-open-lead-form>` (not `<button>`), so they work without JS; the dialog script calls `preventDefault()` and opens the dialog only when JS is available. Include `LeadFormDialog` on home/category/contacts/calculator pages (not on `/zayavka`).

**Interfaces:**
- `LeadForm.astro` props `{ source: LeadSource; preset?: { categorySlug?: string; taskId?: string; urgency?: Urgency; location?: Location; estimateFrom?: number; estimateTo?: number; message?: string }; compact?: boolean; title?: string }`.
- Form attributes: `method="post" action="/api/lead" enctype="multipart/form-data" data-lead-form`.
- Hidden fields: `source`, `page`, `attribution`, `startedAt`, `website` (honeypot), `categorySlug`, `taskId`, `urgency`, `location`, `estimateFrom`, `estimateTo`.
- `LeadFormDialog.astro`: native `<dialog id="lead-form-dialog">` with close button, `LeadForm source="form"`, `noscript` link to `/zayavka`; listens for clicks on `[data-open-lead-form]` (anchors to `/zayavka`) and `window` event `tmt:open-lead-form` with detail `{ source?, categorySlug?, taskId?, urgency?, location?, estimateFrom?, estimateTo?, message? }`; on click, `preventDefault()`, sets hidden fields, `showModal()`, focuses phone; closes on backdrop/Escape, restores focus. Without JS the anchor navigates to `/zayavka`.
- `PhotoUpload.astro`: input `name="photos"` multiple accept `image/jpeg,image/png,image/webp,image/heic,image/heif`; previews; remove; updates `input.files` via `DataTransfer`.
- `src/lib/photo.ts`: `compressImage(file: File): Promise<File>`, `preparePhotos(files: File[], compress?: (file: File) => Promise<File>): Promise<File[]>`; imports `CLIENT_PHOTO_LIMITS`/`validatePhotoFiles` from `@/lib/photo-limits`. No duplicated limits.
- `src/scripts/lead-form.ts`: intercepts submit, client validation, `FormData`, attribution, fetch, success/error states; tracks `lead_submit`/`lead_error` via `track`.

- [ ] **Step 1: Write failing photo unit tests**

`tests/unit/photo.test.ts`:
- `preparePhotos([], fakeCompress)` → `[]`.
- 4 files → rejects with `'Не более 3 фото'`.
- 3 JPEGs 1MB with a fake compressor returning 1MB files → returns 3 files.
- A 5MB JPEG with a fake compressor returning a 1.5MB JPEG → output is 1.5MB (compression was used).
- A compressor that rejects → rejects with `'Не удалось обработать фото. Отправьте его в Instagram или Viber.'`.
Run → FAIL.

- [ ] **Step 2: Write failing lead form E2E**

`tests/e2e/lead-form.spec.ts`:
- Home: click `[data-open-lead-form]`; dialog visible; submit empty → phone/consent errors; invalid phone `+375 11 123-45-67` → error; valid `+375 29 123-45-67` + consent → success text «Заявка принята» (test mode).
- Intercept `page.route('**/api/lead', ...)` to inspect `FormData`: phone normalized, source, attribution JSON contains `utmSource` from localStorage (set via `page.addInitScript`), `files` count 1 after selecting a fixture.
- Use a ~3MB JPEG fixture; after selection, the submitted `File.size` is ≤2MB (client compression actually ran).
- Error: route fulfill 500 → error text with `tel:+375257076793` and `viber://chat`.
- No-JS: `browser.newContext({ javaScriptEnabled: false })`, go to `/zayavka`, fill phone/consent, submit → URL `/spasibo`.
Run → FAIL.

- [ ] **Step 3: Implement form UI and photo helpers**

- `Field.astro`: label, input/textarea, hint, error; `aria-describedby`.
- `PhoneField.astro`: `type="tel"`, `inputmode="tel"`, `autocomplete="tel"`, `maxlength="19"`, `data-phone-input`; script formats on input using `formatBelarusPhone`.
- `Checkbox.astro`: consent checkbox with error.
- `PhotoUpload.astro`: renders hidden file input, button-like label, previews container, counter; script imports `preparePhotos`, `validatePhotoFiles`; on change, compress; on error show message; remove buttons; update input files.
- `Spinner.astro`, `InlineStatus.astro`: status UI.
- `LeadForm.astro`: fields name (optional), phone (required), message (optional), photos, consent; hidden fields; submit button; status area; `<noscript>` message with phone/Viber and link `/zayavka` if in dialog.
- `LeadFormDialog.astro`: dialog markup, close button, `LeadForm`; script for open/close/preset.
- `/zayavka.astro`: `BaseLayout` noindex? Use `noindex: true`; H1 «Оставить заявку», `LeadForm source="form"` inline; contact alternatives; no dialog.
- `src/scripts/lead-form.ts`: on page load, call `captureAttribution(location.search, document.referrer, location.pathname, localStorage)` so UTM/gclid/yclid are saved; on submit, `normalizeBelarusPhone`; if invalid, show error; ensure consent; build `FormData(form)`; set `attribution` from `getAttribution(localStorage, location.pathname, device)`; set `startedAt` if empty; `fetch('/api/lead', { method:'POST', body: formData, headers: { 'X-Requested-With':'fetch' } })`; on 200 JSON success → hide form fields, show success + Instagram CTA; on error → show error + phone/Viber; track events; on native fallback, no JS intercept.

- [ ] **Step 4: Wire dialog into pages**

Add `<LeadFormDialog />` to home, category, contacts, calculator pages (calculator later). Add `<a href="/zayavka" data-open-lead-form>` triggers to ContactBlock/CtaBand (JS intercepts to open the dialog; no-JS follows the link). Do not include the dialog on `/zayavka`.

- [ ] **Step 5: Implement photo compression**

`compressImage`: if `file.type === 'image/jpeg' && file.size <= 2MB`, return file. Else load via `createImageBitmap` or `<img>`; draw to canvas with max dimension 1600; `toBlob('image/jpeg', 0.82)`; return `new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })`. If decode/encode fails, throw `new Error('Не удалось обработать фото. Отправьте его в Instagram или Viber.')`.
`preparePhotos`: validate first with `CLIENT_PHOTO_LIMITS`; `Promise.all(files.map(compress))` where `compress` defaults to `compressImage`; re-validate total; return. Tests inject a fake compressor so canvas is not needed in unit tests.

- [ ] **Step 6: Run tests**

Run: `npm run test -- tests/unit/photo.test.ts`
Expected: PASS.
Run: `npm run test:e2e -- tests/e2e/lead-form.spec.ts`
Expected: PASS.
Run: `npm run check && npm run lint && npm run build`
Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/forms src/components/ui src/lib/photo.ts src/scripts/lead-form.ts src/pages/zayavka.astro src/components/marketing tests
git commit -m "feat: add short lead form with photo compression and dialog"
```

---

### Task 11b: Remove reviews (scope change 2026-11-26)

**Why:** владелец отменил отзывы полностью. Это не «пустой блок» и не «позже»: отзывов нет нигде — ни страницы, ни формы, ни API, ни блока на главной, ни ссылок в навигации, ни схемы/JSON-LD.

**Files:**
- Delete: `src/data/reviews.ts`, `src/components/marketing/Reviews.astro`, `src/components/marketing/ReviewCard.astro`.
- Modify: `src/lib/content/schemas.ts` (remove `ReviewSchema`, `Review` type), `src/lib/content/index.ts` (remove `reviews` from raw/schema/content, remove `getPublishedReviews`), `src/lib/jsonld.ts` (remove `reviewJsonLd`), `src/pages/index.astro` (remove the reviews section/import), `src/components/layout/Header.astro` and `Footer.astro` (remove «Отзывы» links), `tests/unit/content.test.ts` and `tests/unit/jsonld.test.ts` (remove review fixtures/assertions).
- Do not create `src/pages/otzyvy.astro`, `ReviewForm.astro`, `Rating.astro`, `src/lib/reviews/*`, or `src/pages/api/review.ts` (they were planned but are cancelled).
- Keep the old `docs/superpowers/specs/2026-09-07-reviews-design.md` for archive only; Task 16 moves it to `docs/archive/`.

**Interfaces:** none new.

- [ ] **Step 1: Find every review reference**

Run:
```bash
grep -RIn "review\|Review\|отзыв\|Отзыв\|otzyvy" src tests package.json
```
Expected: content schema/types/data, home/nav, JSON-LD and tests only.

- [ ] **Step 2: Remove content schema/data/getters**

Remove `ReviewSchema`, `Review`, `reviewsData`, `reviews` from `ContentSchema`/`parseContent`/`content`, and `getPublishedReviews`. Update the content tests/raw fixtures so no `reviews` key is required.

- [ ] **Step 3: Remove home/nav surface**

Delete `Reviews.astro`/`ReviewCard.astro`; remove the home import and section; remove «Отзывы» from header desktop/mobile nav and footer. Do not leave empty headings or dead links.

- [ ] **Step 4: Remove JSON-LD/tests**

Remove `reviewJsonLd` and its tests. Do not emit `Review`/`AggregateRating` JSON-LD.

- [ ] **Step 5: Verify no product review surface remains**

Run:
```bash
grep -RIn "review\|Review\|отзыв\|Отзыв\|otzyvy" src tests
```
Expected: no matches (excluding the old archived spec, which is outside `src/tests`).

- [ ] **Step 6: Run tests and build**

Run:
- `npm run test`
- `npm run test:e2e`
- `npm run check && npm run lint && npm run build`
Expected: all pass; home/lead/catalog tests unaffected.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove reviews from product scope"
```

---

### Task 12: Calculator page and lead prefill

**Files:**
- Create: `src/pages/kalkulyator.astro`, `src/components/calculator/Calculator.astro`, `CalculatorStep.astro`, `EstimateBreakdown.astro`, `src/scripts/calculator.ts`, `tests/e2e/calculator.spec.ts`.
- Modify: `src/pages/kalkulyator.astro` includes `<LeadFormDialog />`.

**Interfaces:**
- `Calculator.astro` props `{ categories: Category[]; tasks: CalculatorTask[]; works: Work[]; pricing: PricingConfig }`.
- Serialized data: `<script type="application/json" id="calculator-data">` with `{ categories: {slug,title,icon}[], tasks: CalculatorTask[], works: Work[], pricing: PricingConfig }`; use `set:html={JSON.stringify(data)}` and ensure `<` escaped (`JSON.stringify(data).replace(/</g, '\\u003c')`).
- `CalculatorStep.astro` props `{ step: 1|2|3; title: string; active: boolean }`.
- `EstimateBreakdown.astro` props `{ estimate: Estimate }` for the static example/no-JS description.
- Client state: `{ step, categorySlug, taskId, urgency, location }`; URL query params; `tmt:open-lead-form` event detail with `{ source: 'calculator', categorySlug, taskId, urgency, location, estimateFrom, estimateTo, message }`.
- Analytics events: `calculator_start`, `calculator_step_1`, `calculator_step_2`, `calculator_step_3`, `calculator_result`.

- [ ] **Step 1: Write failing calculator E2E**

`tests/e2e/calculator.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('calculates 68–92 BYN', async ({ page }) => {
  await page.goto('/kalkulyator');
  await page.getByRole('radio', { name: 'Сантехника' }).check();
  await page.getByRole('button', { name: 'Далее' }).click();
  await page.getByRole('radio', { name: 'Замена смесителя' }).check();
  await page.getByRole('button', { name: 'Далее' }).click();
  await page.getByRole('radio', { name: 'В течение 2 часов' }).check();
  await page.getByRole('radio', { name: 'За городом до 20 км' }).check();
  await expect(page.getByText('68–92 BYN')).toBeVisible();
});

test('beyond 20 km asks to call', async ({ page }) => {
  await page.goto('/kalkulyator?category=santehnika&task=zamena-smesitelya&urgency=asap&location=beyond');
  await expect(page.getByText('Уточним по телефону')).toBeVisible();
});

test('opens lead form with prefilled estimate', async ({ page }) => {
  await page.goto('/kalkulyator?category=santehnika&task=zamena-smesitelya&urgency=asap&location=out_of_town');
  await page.getByRole('button', { name: 'Вызвать мастера' }).click();
  const dialog = page.locator('#lead-form-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('input[name="taskId"]')).toHaveValue('zamena-smesitelya');
  await expect(dialog.locator('input[name="estimateFrom"]')).toHaveValue('68');
});
```
Run → FAIL.

- [ ] **Step 2: Implement page shell and calculator component**

`/kalkulyator` page: `BaseLayout` with SEO title «Калькулятор стоимости работ в Гродно», intro, `<Calculator ... />`, `<LeadFormDialog />`, `EstimateBreakdown` static example, FAQ, `CtaBand`. The calculator component renders:
- `<div data-calculator>` with progress `1/3`, step 1 category cards (`input type=radio name=category`), step 2 task cards (`name=task`), step 3 urgency (`name=urgency`) and location (`name=location`) fieldsets, result container `data-calculator-result` with `aria-live="polite"`, back/next buttons.
- Buttons: step 1 next disabled until category; step 2 next disabled until task; step 3 result live.
- `data-calculator-empty` for no tasks.

- [ ] **Step 3: Implement client script**

`src/scripts/calculator.ts`:
- Read JSON; if missing, return.
- State from URL query; validate category/task; default urgency `this_week`, location `city`; if valid task and category, start at step 3; else step 1.
- `renderStep()` toggles steps, updates progress, focus heading.
- `calculate()` builds `EstimateInput` from selected task/work/pricing and calls `calculateEstimate`. Treat `estimate.from`/`estimate.to` as authoritative. Render `formatRange`, breakdown lines, duration, disclaimer, notice. When `estimate.minOrderApplied`, show a visible «Применён минимальный заказ» note (amount from `pricing.minOrder`) and do not present the sum of `lines` as the total. If `estimate.requiresPhone`, show «Уточним по телефону» plus a phone CTA; do not present the base as a firm price. For beyond, show `Уточним по телефону` instead of a range, plus the phone button.
- CTA `Вызвать мастера`: if `requiresPhone`, `tel:`; else dispatch `tmt:open-lead-form` with detail and `estimateFrom/To` from estimate.
- Update URL with `history.replaceState` on state changes; use `URLSearchParams`.
- `track('calculator_start')` on first category change; `calculator_step_N`; `calculator_result` on first result.
- Event listeners on radio change; buttons.
- No `innerHTML` with user data; use `textContent`/DOM creation.

- [ ] **Step 4: Implement `EstimateBreakdown.astro`**

A static example on the page: «Как считается цена» with lines (работа, срочность, загород, диагностика) using the demo 40–60 example. Not the dynamic result. Good for SEO/no-JS.

- [ ] **Step 5: Run tests**

Run: `npm run test:e2e -- tests/e2e/calculator.spec.ts`
Expected: PASS.
Run: `npm run check && npm run lint && npm run build`
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/kalkulyator.astro src/components/calculator src/scripts/calculator.ts tests/e2e/calculator.spec.ts
git commit -m "feat: add 3-step estimate calculator with lead prefill"
```

---

### Task 13: Removed — reviews cancelled (2026-11-26)

Отзывы исключены из объёма по решению владельца. Cleanup выполнен в Task 11b. Не создавать страницу `/otzyvy`, `ReviewForm`, `Rating`, `src/lib/reviews`, `src/pages/api/review.ts`, `Review`/`ReviewSchema`/`reviewJsonLd`/`review_submit`.

---

### Task 14: Static pages — conditions, about, contacts, privacy, thank you, 404

**Files:**
- Create: `src/pages/usloviya.astro`, `o-mastere.astro`, `kontakty.astro`, `politika-konfidencialnosti.astro`, `spasibo.astro`, `404.astro`, `tests/e2e/static-pages.spec.ts`.

**Interfaces:**
- `/usloviya` uses `conditions` from `src/data/conditions.ts`.
- `/kontakty` uses `ContactBlock` + map link (no embed).
- `/spasibo` `noindex: true`, success copy, Instagram CTA, phone; script tracks `lead_submit` only if consent accepted, source from `?source=`.
- `/404` status 404, links to home/services/calculator.

- [ ] **Step 1: Write failing static pages E2E**

`tests/e2e/static-pages.spec.ts`:
- Each route returns 200, has one H1, contains the brand in title.
- `/spasibo` has `<meta name="robots" content="noindex">`.
- `/404` returns 404 and contains «Страница не найдена».
- `/kontakty` links `tel:`, `viber://`, `ig.me`.
- Footer has privacy link.
Run → FAIL.

- [ ] **Step 2: Implement pages**

- `/usloviya`: H1 «Условия работы», sections from `conditions`, CtaBand, FAQ? Maybe.
- `/o-mastere`: H1 «О мастере», text about experience/principles (placeholder copy marked demo), photo placeholder/logo, CTA, Instagram link.
- `/kontakty`: H1 «Контакты», `ContactBlock`, Viber/Instagram cards, area/hours, link to Yandex Maps (optional), `LeadFormDialog` + button.
- `/politika-konfidencialnosti`: `noindex: true`, H1, operator details from `site`, sections: what data, why, storage, cookies, rights, contact. Include a `TODO: legal review` comment in the source. Link from footer/forms.
- `/spasibo`: H1 «Заявка принята», text, Instagram CTA, phone, link home. `noindex`.
- `/404`: H1, helpful links, phone.

- [ ] **Step 3: Run tests**

Run: `npm run test:e2e -- tests/e2e/static-pages.spec.ts`
Expected: PASS.
Run: `npm run check && npm run build`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages tests/e2e/static-pages.spec.ts
git commit -m "feat: add conditions, about, contacts, privacy, thank-you and 404 pages"
```

---

### Task 15: SEO, consent banner, analytics integration, robots/sitemap

**Files:**
- Create: `src/components/analytics/Analytics.astro`, `ConsentBanner.astro`, `src/scripts/tracking.ts`, `src/pages/robots.txt.ts`, `tests/e2e/seo-analytics.spec.ts`.
- Modify: `src/layouts/BaseLayout.astro` (include `ConsentBanner`, `Analytics`, `tracking`), `src/components/layout/Header.astro`/`Footer.astro`/marketing components (add `data-track` attributes), `src/pages/spasibo.astro` (tracking), `astro.config.mjs` sitemap filter.
- Modify: pages to add JSON-LD where missing.

**Interfaces:**
- `Analytics.astro`: reads `PUBLIC_YM_ID` (default `112934654`), `PUBLIC_GA_ID`, `PUBLIC_GOOGLE_ADS_ID`; on `getConsent() === 'accepted'` or `tmt:consent` accepted, injects Yandex/GA scripts once; sets `window.__tmtYmId`.
- `ConsentBanner.astro`: visible only when `getConsent() === null`; buttons «Принять» and «Только необходимые»; sets consent, dispatches `tmt:consent`; link to privacy.
- `src/scripts/tracking.ts`: delegated click handler for `[data-track]`; reads `data-track-event` and optional `data-track-params` JSON; calls `track`.
- `robots.txt.ts`: `User-agent: *`, `Allow: /`, `Disallow: /spasibo`, `Disallow: /zayavka`, `Sitemap: ${Astro.site}sitemap-index.xml`.

- [ ] **Step 1: Write failing SEO/analytics E2E**

`tests/e2e/seo-analytics.spec.ts`:
- Home `<title>` contains `The Master Time`; meta description non-empty; canonical equals `/`.
- Home JSON-LD includes `LocalBusiness`; category JSON-LD includes `Service`.
- `GET /sitemap-index.xml` 200 and includes `/uslugi/santehnika`; `GET /robots.txt` contains `Sitemap:` and `Disallow: /spasibo`.
- First visit shows consent banner; no `script[src*="mc.yandex"]` before accept; click «Принять» → localStorage `tmt_consent=accepted`, banner hidden, `script[src*="mc.yandex"]` appears; reload → no banner.
- After accept, click phone link → `window.dataLayer` contains `event: 'phone_click'`; click Instagram → `instagram_click`; click Viber → `viber_click`.
- Visit `/?utm_source=test&utm_medium=cpc`, then submit lead via dialog; intercepted request includes `utmSource=test` or attribution JSON contains it.
Run → FAIL.

- [ ] **Step 2: Implement consent banner and analytics loader**

`ConsentBanner.astro`: markup + script; uses `getConsent`/`setConsent`; hidden attribute; buttons; link; no external scripts. On accept, dispatch `new CustomEvent('tmt:consent', { detail: 'accepted' })`.
`Analytics.astro`: script that checks consent; if accepted, calls `loadAnalytics()`; listens for `tmt:consent`; `loadAnalytics` creates script tags for Yandex Metrika (`https://mc.yandex.ru/metrika/tag.js?id=${id}`) and GA (`https://www.googletagmanager.com/gtag/js?id=${gaId}`), initializes `ym(id, 'init', {...})` and `gtag('js', new Date())`, `gtag('config', gaId)`, `gtag('config', adsId)`; sets `window.__tmtYmId`. Guard against double load.
`src/scripts/tracking.ts`: `document.addEventListener('click', e => { const el = e.target.closest('[data-track]'); if (!el) return; const event = el.dataset.trackEvent; const params = el.dataset.trackParams ? JSON.parse(...) : {}; track(event, params); })`.
Add `data-track` to phone/Viber/Instagram links and CTA buttons:
- phone: `data-track-event="phone_click" data-track-params='{"placement":"header"}'` etc.
- Viber: `viber_click` with placement.
- Instagram: `instagram_click` with placement (`header`, `home`, `category`, `contacts`).

- [ ] **Step 3: Add JSON-LD and sitemap/robots**

- Home: `[localBusinessJsonLd(site, categories), faqJsonLd(faqs)]` (already Task 8; verify).
- Category: `[serviceJsonLd(category, site, pricing), breadcrumbJsonLd(...), faqJsonLd(category.faq)]` (Task 9).
- Contacts: `localBusinessJsonLd`.
- Reviews: не добавлять; отзывы исключены из объёма (Task 11b).
- `astro.config.mjs` sitemap filter excludes `/spasibo`, `/zayavka` и `/politika-konfidencialnosti`.
- `robots.txt.ts` as above.

- [ ] **Step 4: Track `/spasibo` lead submit**

`spasibo.astro` inline script: if `getConsent() === 'accepted'`, `track('lead_submit', { source: new URLSearchParams(location.search).get('source') ?? 'native' })`. The inline form on `/zayavka` also tracks on fetch success. Avoid double-count: `/spasibo` is only reached by native fallback; fetch success stays on the page. Good.

- [ ] **Step 5: Run tests**

Run: `npm run test:e2e -- tests/e2e/seo-analytics.spec.ts`
Expected: PASS.
Run: `npm run check && npm run lint && npm run test && npm run build`
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/analytics src/scripts/tracking.ts src/pages/robots.txt.ts src/layouts/BaseLayout.astro src/components src/pages tests/e2e/seo-analytics.spec.ts astro.config.mjs
git commit -m "feat: add seo, consent and analytics integration"
```

---

### Task 16: Polish, accessibility, docs, legacy cleanup, launch checklist

**Files:**
- Create: `README.md` (full), `AGENTS.md` (full), `docs/architecture.md`, `docs/content-guide.md`, `docs/design-system.md`, `docs/analytics.md`, `docs/seo.md`, `docs/deployment.md`, `docs/ai-roadmap.md`, `docs/qa.md`, `docs/decisions/ADR-001-astro.md`, `ADR-002-lead-delivery.md`, `ADR-003-responsive-rebuild.md`, `tests/e2e/a11y.spec.ts`.
- Modify/Delete: legacy files (`index.html`, `css/`, `js/`, `server.js`, `server.log`, `server-err.log`, `package.json` deps, `.env.example`, `.gitignore`), old spec move to `docs/archive/`.
- Delete only after confirmation: `uploads/`.

**Interfaces:**
- Docs describe the exact commands, routes, data schemas, env, lead flow, analytics, Viber/SMTP setup, AI roadmap, cutover.
- `AGENTS.md` guardrails: no `Pracue`, no Notion, no fixed stages, no hardcoded prices, no secrets, no fake social proof/prices, no reviews (cancelled 2026-11-26), run tests, don't delete legacy data without confirmation.

- [ ] **Step 1: Add accessibility tests**

`tests/e2e/a11y.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const path of ['/', '/uslugi/santehnika', '/kalkulyator', '/kontakty']) {
  test(`a11y ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
```
Run: `npm run test:e2e -- tests/e2e/a11y.spec.ts`
Expected: FAIL with violations; fix focus/labels/contrast/landmarks until PASS.

- [ ] **Step 2: Performance sanity checks**

Run `npm run build`; inspect `dist/client/_astro/*.js` total gzip; ensure initial JS < 100KB. Use `npx lighthouse http://localhost:4321 --only-categories=performance,seo,accessibility,best-practices --chrome-flags="--headless"` against `npm run start` (manual; no CI gate). Fix obvious issues (images/fonts/CLS).

- [ ] **Step 3: Verify no legacy references**

Run:
```bash
grep -RIn "Pracue\|notion\|Notion\|express\|multer\|1920\|402" src package.json README.md AGENTS.md docs --exclude-dir=archive || true
```
Expected: no matches in the new app/docs (old `docs/archive` excluded; old spec moved there). Remove `server.js`, `css/`, `js/`, `index.html`, `server.log`, `server-err.log`. Update `package.json` name/description, remove Express/Multer deps, run `npm install`. Tag `legacy-site` before deletion (on `main` commit).
- `uploads/`: inspect with the owner; if test data, delete; if unsure, leave and add to `.gitignore` with a note. Do not delete real data.
- Move old spec `docs/superpowers/specs/2026-09-07-reviews-design.md` to `docs/archive/2026-09-07-reviews-design.md`.

- [ ] **Step 4: Write developer/AI docs**

- `README.md`: overview, stack, quick start, scripts, env, structure, deploy, content editing, links to docs.
- `AGENTS.md`: project rules, commands, file map, data schemas, design tokens, routes, lead flow, analytics, definition of done, guardrails, "how to add a service/price/page", "how to run tests", "do not".
- `docs/architecture.md`: Mermaid diagram browser → Astro → API → notifiers; rendering strategy; data flow; env; security.
- `docs/content-guide.md`: edit `src/data/categories.ts`, `calculator.ts`, `pricing.ts`, `faq.ts`, `site.ts`; demo marker; validation command; content launch checklist.
- `docs/design-system.md`: tokens, typography, spacing, components, responsive, a11y.
- `docs/analytics.md`: event table, consent, UTM, goals, how to add an event.
- `docs/seo.md`: routes, meta, JSON-LD, keyword map, content plan.
- `docs/deployment.md`: Railway, env, SMTP/SPF/DKIM/DMARC, Viber bot setup, staging, cutover, rollback, monitoring.
- `docs/ai-roadmap.md`: future RAG over content, chat/photo/voice, lead creation via same API, guardrails, cost; not in phase 1.
- `docs/qa.md`: test matrix, browsers, devices, critical flows, launch checklist.
- ADRs: Astro, lead delivery, responsive rebuild.

- [ ] **Step 5: Launch content gate**

Add a checklist to `docs/qa.md`:
- [ ] Real prices replace demo values; `npm run validate:content` passes.
- [ ] Real photos or sections hidden/empty state (no reviews — cancelled).
- [ ] Working hours, warranty, payment, min order, urgent/out-of-town values confirmed.
- [ ] Domain, `SITE_URL`, email, SMTP credentials, SPF/DKIM/DMARC.
- [ ] Viber bot token/admin ID or email-only launch confirmed.
- [ ] Legal review of privacy/consent.
- [ ] GA4/Google Ads IDs; Yandex Metrika goals.
- [ ] Test lead email + Viber on staging.
- [ ] Lighthouse/axe pass; no console errors; mobile/desktop verified.
- [ ] Cutover: old site stays 24h, DNS switch, sitemap submitted, Search Console/Webmaster.

- [ ] **Step 6: Final verification**

Run:
```bash
npm run check
npm run lint
npm run test
npm run validate:content
npm run build
npm run test:e2e
```
Expected: all pass.
Run `git status` — no unintended changes, no `.env`, no secrets.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "docs: add developer and ai documentation; chore: remove legacy site"
```

---

## Plan Self-Review

**Spec coverage:**
- Routes `/`, `/uslugi`, `/uslugi/[slug]`, `/ceny`, `/kalkulyator`, `/usloviya`, `/o-mastere`, `/kontakty`, `/spasibo`, `/politika-konfidencialnosti`, 404 — Tasks 8–14. `/zayavka` added as a no-JS/ads-friendly form page (Task 11). Reviews were cancelled and removed (Task 11b); no `/otzyvy`.
- Six categories/slugs — Task 2.
- Calculator formula and boundaries — Task 5 + Task 12.
- Instagram A+B — Home (Task 8), category (Task 9), contacts (Task 14), calculator result (Task 12).
- Email + Viber delivery — Tasks 6–7; failure behavior — Task 7/11.
- Photos/compression/limits — Task 11.
- Design system/responsive/a11y — Task 4 + Task 16.
- SEO/JSON-LD/sitemap/robots — Task 15.
- Analytics/consent/UTM — Tasks 3/15.
- Docs for developer/AI — Task 16.
- Legacy cleanup/cutover — Task 16 with safety rule.
- AI/CRM are explicitly out of phase 1; only data/API seams (Tasks 2/6/7 + `docs/ai-roadmap.md`).

**Review Focus tests:** see Task 3 (phone/attribution/consent/analytics), Task 5 (pricing boundaries), Task 7 (delivery), Task 11 (photos/lead form), Task 15 (consent/UTM). All five covered.

**Type consistency:** `Category`, `Work`, `CalculatorTask`, `PricingConfig`, `Estimate`, `Lead`, `LeadNotifier`, `Attribution`, `SeoProps` are defined once in Tasks 2/3/5/6 and reused by exact name. `LeadSource` is `'form' | 'calculator' | 'callback'`; `source` values in forms match. `Urgency`/`Location` are defined in Task 5 and imported by Task 11/12. `getCategoryPriceFrom` is defined in Task 5 and used in Task 8.

**Proportion:** The plan is long because the project has 16 independently testable deliverables; code blocks are limited to interfaces, key tests and exact values. Component bodies are intentionally left to the implementer within the stated props/classes.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-11-26-the-master-time-site-rebuild.md`. Please review the plan. Which execution approach would you prefer?

- **Subagent-driven** — a fresh subagent implements each task, a fresh reviewer checks it before the next starts, then a whole-branch review at the end. Most thorough; best for the 16 tasks with many shared interfaces (content schemas, pricing, lead pipeline).
- **Native** — I implement every task myself in this session, then one fresh reviewer checks the whole branch. Cheapest and fastest; no independent review until the end.

For this plan I recommend **Subagent-driven**, because the content schema, pricing engine and lead pipeline are shared interfaces that later tasks consume; a fresh reviewer per task catches type and contract drift before it spreads. Does the plan capture what you want, and which approach should we use?
