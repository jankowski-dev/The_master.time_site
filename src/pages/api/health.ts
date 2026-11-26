import type { APIRoute } from 'astro';

import { healthPayload } from '@/lib/health';

export const prerender = false;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(healthPayload), {
    headers: { 'Content-Type': 'application/json' }
  });
