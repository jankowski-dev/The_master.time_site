# QA

## Test matrix

| Layer      | Command                              | Covers |
| ---------- | ------------------------------------ | ------ |
| Types      | `npm run check`                      | Astro + TS strict |
| Lint       | `npm run lint`                       | ESLint (flat) + Prettier |
| Unit       | `npm run test`                       | phone, attribution, consent, analytics, content, leads, pricing, photos, rate limit, seo, jsonld, viber webhook |
| Content    | `npm run validate:content`           | Zod schemas + cross-references |
| Build      | `npm run build`                      | static build + sitemap |
| E2E        | `npm run test:e2e`                   | home, catalog, prices, calculator, layout, lead form, seo/analytics, static pages, smoke, a11y |
| A11y       | `npm run test:e2e -- tests/e2e/a11y.spec.ts` | axe on `/`, `/uslugi/santehnika`, `/kalkulyator`, `/kontakty` |

## Browsers & devices

Playwright runs against Chromium by default. Before launch, manually verify:

- Chrome / Safari / Firefox, latest two versions.
- Mobile: 375px width (iPhone SE/13) and a large Android (390–430px).
- Desktop: 1280px+.

## Critical flows

- [ ] Lead form opens from every CTA (home, contacts, cta band, calculator).
- [ ] Empty submit shows phone + consent errors; invalid phone is rejected.
- [ ] Valid submit (phone + consent) succeeds and shows «Заявка принята».
- [ ] No-JS submit on `/zayavka` posts natively and redirects to `/spasibo`.
- [ ] Photo attach/compress/remove works; >3 or non-image files are rejected.
- [ ] Calculator: category → task → result; URL state; CTA prefills the form.
- [ ] Price filter: search + category filter + reset without page reload.
- [ ] Consent banner: accept loads analytics, decline does not, banner hidden on reload.
- [ ] FAQ `<details>` opens; mobile menu toggles and closes on Escape.
- [ ] No horizontal overflow at 375/768/1280px.

## Uploads

The new app **does not persist uploads** — lead photos are compressed in the
browser and attached to the email only, then discarded. The `uploads/` directory
is git-ignored for safety; if any legacy `uploads/` data exists from the old
site, review it with the owner before deleting (do not delete real data).

## Launch content gate

- [ ] Real prices replace demo values; `npm run validate:content` passes.
- [ ] Real photos added, or photo sections hidden / empty state (no reviews — cancelled).
- [ ] Working hours, warranty, payment, min order, urgent/out-of-town values confirmed.
- [ ] Domain, `SITE_URL`, email, SMTP credentials, SPF/DKIM/DMARC.
- [ ] Viber bot token/admin ID configured, or email-only launch confirmed.
- [ ] Legal review of privacy/consent text.
- [ ] GA4 / Google Ads IDs set; Yandex Metrika goals configured.
- [ ] Test lead email + Viber sent on staging.
- [ ] Lighthouse / axe pass; no console errors; mobile + desktop verified.
- [ ] Cutover: old site stays 24h, DNS switch, sitemap submitted, Search Console / Webmaster.

## Performance

- Build, then check `dist/client/_astro/*.js` total gzip is under ~100 KB.
- Run Lighthouse (`performance`, `seo`, `accessibility`, `best-practices`)
  against `npm run start`; fix obvious issues (images, fonts, CLS).

## Known notes

- `npm install` reports advisories in transitive dev/build tooling; review with
  `npm audit` before a security-sensitive release.
