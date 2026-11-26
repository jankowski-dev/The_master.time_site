# Content guide

All copy, prices, and structure live in `src/data` — never hardcode them in
pages or components. The files are validated against Zod schemas at build time
and by `npm run validate:content`.

## Files

| File                     | Content                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| `src/data/site.ts`       | Brand, legal name, UNP, phone, email, socials, area, hours, default SEO |
| `src/data/categories.ts` | Six categories, each with works (title, price range, duration, popular) |
| `src/data/calculator.ts` | Calculator tasks referencing a category + work                      |
| `src/data/pricing.ts`    | Currency, min order, urgent %, out-of-town fee/radius, disclaimer    |
| `src/data/faq.ts`        | Shared FAQ items                                                    |
| `src/data/conditions.ts` | Terms: visit/diagnostics, min order, urgent, out-of-town, materials, payment, warranty, hours |

## Demo marker

Every value that is not yet real is marked with a `// demo` comment. Search for
`demo` before launch and replace with confirmed values:

```bash
grep -RIn "demo" src/data
```

The current demo values include prices (`priceFrom` / `priceTo`), working hours,
the contact email (`site@master-time.pro` — create the mailbox or replace it),
the map link, and several conditions.

## Validation

```bash
npm run validate:content
```

Checks:

- Zod schema conformance (types, enums, regex, min lengths).
- Unique category slugs and work ids.
- Calculator tasks reference an existing category and work.

`npm run build` runs `validate:content` automatically.

## Adding a service

Add a `Work` to a category in `src/data/categories.ts`:

```ts
{
  id: 'zamena-smesitelya',
  title: 'Замена смесителя',
  priceFrom: 40, // demo
  priceTo: 60, // demo
  duration: '30–60 мин',
  popular: true
}
```

It appears automatically on `/ceny` and on the category page. To make it
selectable in the calculator, add a `CalculatorTask` in
`src/data/calculator.ts` referencing the same `workId`.

## Launch checklist (content)

- [ ] Replace all `// demo` values with real prices, hours, warranty/payment terms,
      min order, urgent and out-of-town values.
- [ ] Create `site@master-time.pro` (or replace it with the real contact email).
- [ ] Confirm the phone number and UNP in `src/data/site.ts`.
- [ ] `npm run validate:content` passes.
- [ ] Legal review of the privacy policy text (currently a template).
