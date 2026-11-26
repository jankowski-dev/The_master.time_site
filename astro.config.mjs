import { fileURLToPath } from 'node:url';

import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:4321';

/**
 * Astro's `checkOrigin` CSRF guard compares the browser `Origin` header against
 * the adapter-computed `url.origin`. With the Node standalone adapter that
 * origin is derived from `req.headers.host`, but `validateHost` only keeps the
 * full host-with-port when the host appears in `security.allowedDomains` —
 * otherwise it falls back to `http://localhost` (port dropped), and every
 * same-origin POST from `http://localhost:4321` is rejected with a 403.
 *
 * Allowing the canonical site origin (localhost:4321 in dev/E2E, or the
 * production host from `SITE_URL`) makes `validateHost` return the full
 * host-with-port so the origin guard stays enabled without the false positive.
 */
function allowedDomainsFrom(siteUrl) {
  const url = new URL(siteUrl);
  const pattern = {
    protocol: url.protocol.replace(':', ''),
    hostname: url.hostname
  };
  if (url.port) pattern.port = url.port;
  return [pattern];
}

/**
 * Routes that must not appear in the sitemap: the no-JS thank-you page, the
 * standalone lead page and the privacy policy.
 */
const SITEMAP_EXCLUDED = new Set([
  '/spasibo/',
  '/zayavka/',
  '/politika-konfidencialnosti/'
]);

function sitemapFilter(page) {
  try {
    const pathname = new URL(page).pathname;
    return !SITEMAP_EXCLUDED.has(pathname);
  } catch {
    return true;
  }
}

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [sitemap({ filter: sitemapFilter })],
  security: {
    checkOrigin: true,
    allowedDomains: allowedDomainsFrom(SITE_URL)
  },
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }
});
