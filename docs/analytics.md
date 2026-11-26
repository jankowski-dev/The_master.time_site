# Analytics

Analytics is consent-gated and privacy-first. No personal data (phone, name,
message, photos) is ever sent to analytics — only event names and non-PII
parameters.

## How it works

- `src/lib/analytics.ts` exports `track(event, params)`, which pushes to
  `window.dataLayer` and, when present, calls `ym(id, 'reachGoal', …)` and
  `gtag('event', …)`. It never throws.
- `Analytics.astro` initializes `window.dataLayer` in `<head>` and injects the
  Yandex Metrika and Google Analytics/Ads scripts **only after consent**.
- `ConsentBanner.astro` stores `tmt_consent` (`accepted` / `declined`) in
  `localStorage` and dispatches `tmt:consent`.
- `tracking.ts` handles delegated `[data-track]` click tracking and the FAQ
  `toggle` tracking.

## Consent

- Nothing loads until the visitor chooses «Принять» (or already has
  `tmt_consent=accepted`).
- «Только необходимые» stores `declined` and keeps analytics scripts out.

## UTM / attribution

`src/lib/attribution.ts` captures `utm_*`, `gclid`, `yclid`, `referrer`, and
`landingPage` from the query string into `localStorage` (30-day TTL). The value
is attached to each lead (not to analytics).

## Event vocabulary

| Event                 | Params                          | Fired when                                        |
| --------------------- | ------------------------------- | ------------------------------------------------- |
| `phone_click`         | `placement`                     | Any `tel:` CTA (header/footer/sticky/contacts/home/category/cta/thanks) |
| `instagram_click`     | `placement`                     | Any Instagram CTA                                 |
| `viber_click`         | `placement`                     | Any Viber CTA                                     |
| `lead_form_open`      | `placement`                     | Lead dialog opens (`data-open-lead-form` or `tmt:open-lead-form`) |
| `lead_submit`         | `source`                        | Lead form submitted successfully (also on `/spasibo` for native posts) |
| `lead_error`          | `reason`, `status?`             | Validation / server / network failure             |
| `price_filter`        | `query`, `category`             | Price search/category change (debounced 400ms)    |
| `faq_open`            | `question`                      | A FAQ `<details>` opens                           |
| `calculator_start`    | —                               | First category selection in the calculator        |
| `calculator_step_1/2/3`| —                              | Each calculator step shown                        |
| `calculator_result`   | `taskId`, `urgency`, `location`, `requiresPhone` | A result is shown                |

`placement` values include `header`, `footer`, `sticky`, `contacts`, `home`,
`category`, `cta`, `thanks`, `calculator`, `form`. `lead_form_open` defaults to
`form` for generic triggers and to the `source` (`calculator`) when opened from
the calculator.

## Goals (Yandex Metrika / GA4)

Configure these goals/conversions to match the events above:

- `lead_submit` — the primary conversion.
- `calculator_result` — micro-conversion.
- `phone_click`, `viber_click`, `instagram_click` — engagement.
- `lead_form_open`, `price_filter`, `faq_open` — funnel/interaction signals.

## How to add an event

1. Pick a snake_case name and non-PII params, add a row to the table above.
2. Call `track(name, params)` from the relevant script/component.
3. If it is a click, you can use `data-track data-track-event="…"
   data-track-params='{…}'` (delegated handling in `tracking.ts`).
4. Update `docs/analytics.md` and, if needed, add a focused E2E assertion.
