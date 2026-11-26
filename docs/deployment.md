# Deployment

## Hosting

Target: **Railway** (Node standalone server) serving the Astro build, with
Cloudflare in front for DNS/CDN/WAF. Production origin:
**https://master-time.pro**. The site is a single Node process; there is no
external database.

```bash
npm run build    # validates content + builds dist/
npm run start    # node ./dist/server/entry.mjs
```

`PORT` defaults to `4321`; Railway injects its own `PORT`. Bind to
`HOST=0.0.0.0`. `railway.json` in the repo sets the build/start commands and
the `/api/health` health check.

## Environment variables

Set these in the hosting provider (never commit `.env`):

| Variable                  | Notes                                        |
| ------------------------- | -------------------------------------------- |
| `SITE_URL`                | **Required at build time:** `https://master-time.pro` (canonical, sitemap, robots, CSRF allowlist) |
| `HOST`                    | `0.0.0.0` on Railway                         |
| `PORT`                    | Railway injects it; local default `4321`     |
| `PUBLIC_YM_ID`            | Yandex Metrika counter (`112934654`)         |
| `PUBLIC_GA_ID`            | GA4 measurement id                           |
| `PUBLIC_GOOGLE_ADS_ID`    | Google Ads id (optional)                     |
| `SMTP_HOST`/`PORT`/`USER`/`PASS` | Outgoing mail                          |
| `MAIL_FROM` / `MAIL_TO`   | From address / destination for leads (e.g. `site@master-time.pro`) |
| `VIBER_AUTH_TOKEN`        | Viber Bot API token                          |
| `VIBER_ADMIN_ID`          | Viber admin id (lead notifications)          |
| `LEAD_TEST_MODE`          | `1` only for tests; never in production     |

`SITE_URL` must be present when `npm run build` runs, because canonical URLs,
`sitemap-0.xml`, `robots.txt` and the CSRF `allowedDomains` are baked at build
time. Railway makes service variables available to both build and runtime.

## Railway setup

1. Create a Railway project/service from the GitHub repo (branch
   `rebuild/the-master-time` for staging/PR, `main` after cutover). `railway.json`
   supplies the build/start commands and health check.
2. Set the service variables from the table above. At minimum for a test deploy:
   `SITE_URL=https://master-time.pro`, `HOST=0.0.0.0`, `PUBLIC_YM_ID`, SMTP and
   Viber values.
3. Deploy. The first build runs `npm run validate:content && astro build`; the
   service starts with `npm run start` and must pass `GET /api/health`.
4. Add a custom domain `master-time.pro` in Railway → Settings → Networking.
   For Cloudflare DNS:
   - `CNAME @ → <railway-target>` (CNAME flattening at apex) and
     `CNAME www → <railway-target>`.
   - Proxy on; SSL/TLS mode **Full (strict)**.
   - Add a redirect rule `www.master-time.pro → https://master-time.pro` (301).
     The app also allows the `www` origin in its CSRF allowlist as a fallback.
5. Open `https://master-time.pro/`, confirm canonical URLs use the apex, then
   submit `/sitemap-index.xml` to Google Search Console and Yandex Webmaster.

## Email (SMTP) setup

1. Create a sending mailbox on `master-time.pro` (e.g. `site@master-time.pro`)
   and set `SMTP_HOST`, `SMTP_PORT` (465 for implicit TLS), `SMTP_USER`,
   `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO`. Update the privacy-page contact email
   in `src/data/site.ts` to the same real mailbox.
2. Configure **SPF**, **DKIM**, and **DMARC** for the sending domain so lead
   emails are not rejected or quarantined.
   - SPF: `v=spf1 include:<provider> ~all`
   - DKIM: publish the provider's selector/public key.
   - DMARC: start with `p=none`, then move to `p=quarantine`/`p=reject`.

## Viber Bot setup

1. Create a bot and obtain `VIBER_AUTH_TOKEN`.
2. Point the bot webhook at `https://master-time.pro/api/viber/webhook`. The
   endpoint verifies `x-viber-content-signature` (HMAC-SHA256) using
   `VIBER_AUTH_TOKEN` as the key — there is **no separate webhook secret** to
   provision.
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

## Proxy & rate limiting

The lead endpoint derives the client IP from `X-Forwarded-For` (then falls back
to the adapter's `clientAddress`). This is safe only because Railway/Cloudflare
overwrite `X-Forwarded-For` with the true client IP at the edge. **The app must
run behind a proxy that overwrites `X-Forwarded-For`** — do not expose the Node
server directly, otherwise a client could spoof the header and bypass the rate
limit.
