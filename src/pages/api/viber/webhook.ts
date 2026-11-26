import type { APIRoute } from 'astro';

import { verifyViberSignature } from '@/lib/leads/viber';

export const prerender = false;

interface ViberEvent {
  sender?: { id?: string };
}

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text();
  const signature = request.headers.get('x-viber-content-signature');
  const token = process.env.VIBER_AUTH_TOKEN ?? '';

  if (!verifyViberSignature(rawBody, signature, token)) {
    return new Response(JSON.stringify({ status: 1 }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const event = JSON.parse(rawBody) as ViberEvent;
    // Log only the sender id (no PII) so the owner can set VIBER_ADMIN_ID.
    console.log('[viber] sender', event.sender?.id);
  } catch {
    // Signature verified but the body was not JSON; nothing to log.
  }

  return new Response(JSON.stringify({ status: 0 }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
