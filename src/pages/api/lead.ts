import type { APIRoute } from 'astro';

import { getLeadConfig } from '@/lib/env';
import { handleLead } from '@/lib/leads/handle';
import { createNotifiers } from '@/lib/leads/notify';
import { createRateLimiter } from '@/lib/leads/rate-limit';

export const prerender = false;

const rateLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

/**
 * Resolves the client IP for rate limiting. Prefers `X-Forwarded-For` because
 * the production proxy (Railway/Cloudflare) overwrites that header with the
 * true client IP at the edge. The app must therefore run behind a proxy that
 * overwrites `X-Forwarded-For`; if it were ever exposed directly, a client
 * could spoof the header and bypass the limit — in that case fall back to the
 * adapter's `clientAddress`.
 */
function clientIp(request: Request, clientAddress: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return clientAddress || 'unknown';
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const accept = request.headers.get('accept') ?? '';
  const wantsJson =
    accept.includes('application/json') || request.headers.get('x-requested-with') === 'fetch';

  const formData = await request.formData();

  const result = await handleLead(
    {
      formData,
      ip: clientIp(request, clientAddress),
      referer: request.headers.get('referer') ?? '',
      wantsJson
    },
    { notifiers: createNotifiers(getLeadConfig()), rateLimiter }
  );

  if (result.redirect) {
    return new Response(null, { status: 303, headers: { Location: result.redirect } });
  }

  if (wantsJson) {
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(String(result.body), {
    status: result.status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
};
