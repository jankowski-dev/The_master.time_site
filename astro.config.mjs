import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:4321',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [sitemap()]
});
