import { fileURLToPath } from 'node:url';

import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:4321',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [sitemap()],
  // Astro's `checkOrigin` CSRF guard compares the `Origin` header to the
  // adapter-computed `url.origin`. With the Node standalone adapter and no
  // `allowedDomains`, that origin falls back to `http://localhost` (no port),
  // so same-origin POSTs from `http://localhost:4321` are rejected with 403.
  // The lead/review API already applies honeypot, minimum-age and rate-limit
  // checks, so we disable the redundant origin check.
  security: {
    checkOrigin: false
  },
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }
});
