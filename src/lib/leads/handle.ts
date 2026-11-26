import { randomUUID } from 'node:crypto';

import { loadContent } from '@/lib/content';
import { notifyLead } from './notify';
import type { RateLimiter } from './rate-limit';
import type { Lead, LeadNotifier } from './types';
import { parseLeadFormData } from './validate';

const PHONE_LINK = 'tel:+375257076793';
const VIBER_LINK = 'viber://chat?number=%2B375257076793';
const THANK_YOU_URL = '/spasibo?source=form';

export interface HandleInput {
  formData: FormData;
  ip: string;
  userAgent: string;
  referer: string;
  wantsJson: boolean;
}

export interface HandleDeps {
  notifiers: LeadNotifier[];
  rateLimiter: RateLimiter;
  now?: () => Date;
}

export interface HandleResult {
  status: number;
  body: unknown;
  redirect?: string;
}

function jsonError(error: string, fields?: Record<string, string>) {
  return fields ? { ok: false, error, fields } : { ok: false, error };
}

function nativeErrorHtml(): string {
  return [
    '<!doctype html>',
    '<html lang="ru">',
    '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Не удалось отправить заявку</title></head>',
    '<body>',
    '<h1>Не удалось отправить заявку</h1>',
    '<p>Пожалуйста, свяжитесь с нами напрямую:</p>',
    `<p><a href="${PHONE_LINK}">Позвонить</a></p>`,
    `<p><a href="${VIBER_LINK}">Написать в Viber</a></p>`,
    '</body>',
    '</html>'
  ].join('\n');
}

/**
 * Validates a lead submission, enforces the IP rate limit, checks category and
 * task references against content, and fans the lead out to the notifiers.
 * Returns a normalized result that the API route renders as JSON or HTML.
 */
export async function handleLead(input: HandleInput, deps: HandleDeps): Promise<HandleResult> {
  if (!deps.rateLimiter.check(input.ip)) {
    return input.wantsJson
      ? { status: 429, body: jsonError('rate_limited') }
      : { status: 429, body: nativeErrorHtml() };
  }

  const now = deps.now ?? (() => new Date());
  const nowDate = now();

  const parsed = await parseLeadFormData(input.formData, { now: nowDate.getTime() });
  if (!parsed.ok) {
    return input.wantsJson
      ? { status: 400, body: jsonError('validation', parsed.errors) }
      : { status: 400, body: nativeErrorHtml() };
  }

  const errors: Record<string, string> = {};
  if (parsed.input.categorySlug || parsed.input.taskId) {
    const content = loadContent();
    if (
      parsed.input.categorySlug &&
      !content.categories.some((category) => category.slug === parsed.input.categorySlug)
    ) {
      errors.categorySlug = 'Неизвестная категория';
    }
    if (
      parsed.input.taskId &&
      !content.calculatorTasks.some((task) => task.id === parsed.input.taskId)
    ) {
      errors.taskId = 'Неизвестная задача';
    }
  }
  if (Object.keys(errors).length > 0) {
    return input.wantsJson
      ? { status: 400, body: jsonError('validation', errors) }
      : { status: 400, body: nativeErrorHtml() };
  }

  const lead: Lead = {
    ...parsed.input,
    id: randomUUID(),
    createdAt: nowDate.toISOString()
  };

  const { delivered } = await notifyLead(lead, deps.notifiers);

  if (delivered) {
    return input.wantsJson
      ? { status: 200, body: { ok: true, leadId: lead.id } }
      : { status: 303, redirect: THANK_YOU_URL, body: null };
  }

  return input.wantsJson
    ? { status: 502, body: jsonError('delivery_failed') }
    : { status: 400, body: nativeErrorHtml() };
}
