import type { APIRoute } from 'astro';

export const prerender = true;

/**
 * Robots policy. Analytics/lead pages that must not be indexed are disallowed;
 * everything else is allowed. The sitemap index is referenced from the site
 * origin so crawlers can discover the full URL list.
 */
export const GET: APIRoute = ({ site }) => {
  const origin = site?.toString() ?? process.env.SITE_URL ?? 'http://localhost:4321';
  const base = origin.replace(/\/+$/, '');
  const sitemapUrl = `${base}/sitemap-index.xml`;

  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /spasibo',
    'Disallow: /zayavka',
    `Sitemap: ${sitemapUrl}`
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
