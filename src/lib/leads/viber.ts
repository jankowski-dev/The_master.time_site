import { createHmac, timingSafeEqual } from 'node:crypto';

import { formatRange } from '@/lib/pricing/format';
import type { Lead, LeadNotifier } from './types';

export interface ViberConfig {
  token: string;
  adminId: string;
}

const VIBER_API_URL = 'https://chatapi.viber.com/pa/send_message';

/** Short text summary of a lead for a Viber message (no photos). */
function formatViberText(lead: Lead): string {
  const lines: string[] = ['Новая заявка'];
  if (lead.name) lines.push(`Имя: ${lead.name}`);
  lines.push(`Телефон: ${lead.phone}`);
  lines.push(`Источник: ${lead.source}`);
  if (lead.page) lines.push(`Страница: ${lead.page}`);
  if (lead.estimateFrom !== undefined) {
    lines.push(`Оценка: ${formatRange(lead.estimateFrom, lead.estimateTo)}`);
  }
  if (lead.message) lines.push(`Сообщение: ${lead.message}`);
  return lines.join('\n');
}

/**
 * Sends a plain text message to the Viber Bot API. Throws on a non-2xx
 * response.
 */
export async function sendViberText(
  config: ViberConfig,
  text: string,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const response = await fetchImpl(VIBER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Viber-Auth-Token': config.token
    },
    body: JSON.stringify({ receiver: config.adminId, type: 'text', text })
  });

  if (!response.ok) {
    throw new Error(`Viber API error: ${response.status}`);
  }
}

/**
 * Creates a Viber lead notifier, or `null` when the token or admin id is
 * missing so callers can simply filter it out.
 */
export function createViberNotifier(
  config: ViberConfig,
  fetchImpl?: typeof fetch
): LeadNotifier | null {
  if (!config.token || !config.adminId) return null;

  return {
    name: 'viber',
    async send(lead: Lead): Promise<void> {
      await sendViberText(config, formatViberText(lead), fetchImpl);
    }
  };
}

/**
 * Verifies a Viber webhook `x-viber-content-signature` HMAC-SHA256 signature
 * against the raw request body, using a constant-time comparison.
 */
export function verifyViberSignature(
  rawBody: string,
  signature: string | null,
  token: string
): boolean {
  if (!signature || !token) return false;

  const expected = createHmac('sha256', token).update(rawBody).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}
