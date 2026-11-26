# Deployment

## Hosting

Target: **Railway** (Node standalone server) serving the Astro build, with a
CDN (e.g. Cloudflare) in front for static assets and caching. The site is a
single Node process; there is no external database.

```bash
npm run build    # validates content + builds dist/
npm run start    # node ./dist/server/entry.mjs
```

`PORT` defaults to `4321`.

## Environment variables

Set these in the hosting provider (never commit `.env`):

| Variable                  | Notes                                        |
| ------------------------- | -------------------------------------------- |
| `SITE_URL`                | Canonical origin, e.g. `https://example.by` |
| `PORT`                    | Server port                                  |
| `PUBLIC_YM_ID`            | Yandex Metrika counter                       |
| `PUBLIC_GA_ID`            | GA4 measurement id                           |
| `PUBLIC_GOOGLE_ADS_ID`    | Google Ads id (optional)                     |
| `SMTP_HOST`/`PORT`/`USER`/`PASS` | Outgoing mail                          |
| `MAIL_FROM` / `MAIL_TO`   | From address / destination for leads         |
| `VIBER_AUTH_TOKEN`        | Viber Bot API token                          |
| `VIBER_ADMIN_ID`          | Viber admin id (lead notifications)          |
| `LEAD_TEST_MODE`          | `1` only for tests (in-memory notifier)      |

## Email (SMTP) setup

1. Create a sending mailbox and set `SMTP_HOST`, `SMTP_PORT` (465 for implicit
   TLS), `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO`.
2. Configure **SPF**, **DKIM**, and **DMARC** for the sending domain so lead
   emails are not rejected or quarantined.
   - SPF: `v=spf1 include:<provider> ~all`
   - DKIM: publish the provider's selector/public key.
   - DMARC: start with `p=none`, then move to `p=quarantine`/`p=reject`.

## Viber Bot setup

1. Create a bot and obtain `VIBER_AUTH_TOKEN`.
2. Point the bot webhook at `https://<domain>/api/viber/webhook` (the endpoint
   verifies `x-viber-content-signature` with `VIBER_AUTH_TOKEN`).
3. Send the bot a message once; the webhook logs `sender.id` to the server logs
   — copy that id into `VIBER_ADMIN_ID`.
4. Leads then arrive as plain-text Viber messages to that admin chat.

If Viber is not desired at launch, leave `VIBER_AUTH_TOKEN`/`VIBER_ADMIN_ID`
empty — leads are delivered by email only (email is the required channel).

## Staging

- Deploy the branch with `LEAD_TEST_MODE` off, real SMTP, and a test
  `MAIL_TO`/`VIBER_ADMIN_ID`.
- Submit a test lead and confirm email + Viber arrival before cutover.

## Cutover (from the legacy site)

1. Keep the legacy site live on `main` for 24h after the new site is live.
2. Switch DNS to the new deployment; keep the old origin reachable as a
   fallback.
3. Submit `/sitemap-index.xml` in Google Search Console and Yandex Webmaster;
   request indexing of the top pages.
4. Verify `/robots.txt`, canonical URLs, and JSON-LD on the live origin.

## Rollback

- Point DNS back to the legacy origin (still on `main`).
- Revert the `SITE_URL`/DNS record to the previous value.

## Monitoring

- `GET /api/health` returns `{"ok":true,"service":"the-master-time"}` — use it
  for uptime checks.
- Watch server logs for lead-delivery errors (email/Viber failures are logged).
- Keep the rate limiter in mind: 10 leads/minute/IP (in-memory, per process).
