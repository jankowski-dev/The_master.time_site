import type { Attribution } from '@/lib/attribution';
import { normalizeBelarusPhone } from '@/lib/phone';
import { SERVER_PHOTO_LIMITS, validatePhotoFiles } from '@/lib/photo-limits';
import type { Location, Urgency } from '@/lib/pricing/types';
import type { LeadInput, LeadParseResult, LeadPhoto, LeadSource } from './types';

const MAX_NAME = 80;
const MAX_MESSAGE = 1000;
const MAX_PAGE = 200;
const MAX_ATTRIBUTION = 2000;
const MIN_FORM_AGE_MS = 3000;

const SOURCES: readonly LeadSource[] = ['form', 'calculator', 'callback'];
const URGENCIES: readonly Urgency[] = ['asap', 'this_week', 'flexible'];
const LOCATIONS: readonly Location[] = ['city', 'out_of_town', 'beyond'];

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function parseOptionalNumber(value: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function isTruthy(value: string): boolean {
  return value === '1' || value === 'true' || value === 'on';
}

function parseAttribution(raw: string): Attribution {
  if (!raw) return {};
  const capped = raw.slice(0, MAX_ATTRIBUTION);
  try {
    const parsed: unknown = JSON.parse(capped);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const result: Attribution = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'string') {
          (result as Record<string, string>)[key] = value;
        }
      }
      return result;
    }
  } catch {
    // fall through to empty attribution
  }
  return {};
}

/**
 * Parses and validates a raw `FormData` payload into a normalized `LeadInput`.
 * Never throws; returns field-level errors keyed by field name instead.
 */
export async function parseLeadFormData(
  form: FormData,
  opts: { now?: number } = {}
): Promise<LeadParseResult> {
  const now = opts.now ?? Date.now();
  const errors: Record<string, string> = {};

  const name = field(form, 'name');
  const phone = normalizeBelarusPhone(field(form, 'phone'));
  const message = field(form, 'message');
  const categorySlug = field(form, 'categorySlug');
  const taskId = field(form, 'taskId');
  const urgency = field(form, 'urgency');
  const location = field(form, 'location');
  const estimateFrom = parseOptionalNumber(field(form, 'estimateFrom'));
  const estimateTo = parseOptionalNumber(field(form, 'estimateTo'));
  const source = field(form, 'source');
  const page = field(form, 'page');
  const consent = field(form, 'consent');
  const website = field(form, 'website');
  const startedAt = field(form, 'startedAt');
  const attribution = parseAttribution(field(form, 'attribution'));

  if (!phone) errors.phone = 'Укажите корректный номер телефона';
  if (name.length > MAX_NAME) errors.name = 'Слишком длинное имя';
  if (message.length > MAX_MESSAGE) errors.message = 'Слишком длинное сообщение';
  if (page.length > MAX_PAGE) errors.page = 'Слишком длинный адрес';
  if (!SOURCES.includes(source as LeadSource)) errors.source = 'Неверный источник';
  if (!isTruthy(consent)) errors.consent = 'Необходимо согласие на обработку данных';
  if (website !== '') errors.website = 'Недопустимое значение';

  if (startedAt !== '') {
    const startedAtMs = Number(startedAt);
    if (!Number.isFinite(startedAtMs) || now - startedAtMs < MIN_FORM_AGE_MS) {
      errors.startedAt = 'Заявка отправлена слишком быстро';
    }
  }

  const photos: LeadPhoto[] = [];
  const fileEntries = form
    .getAll('photos')
    .filter(
      (entry): entry is File => entry instanceof File && entry.size > 0
    );
  const photoError = validatePhotoFiles(
    fileEntries.map((file) => ({ type: file.type, size: file.size, name: file.name })),
    SERVER_PHOTO_LIMITS
  );
  if (photoError) {
    errors.photos = photoError;
  } else {
    for (const file of fileEntries) {
      photos.push({
        filename: file.name,
        contentType: file.type,
        size: file.size,
        content: Buffer.from(await file.arrayBuffer())
      });
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  // Invariant: `phone` is non-null whenever there are no errors.
  const normalizedPhone = phone as string;

  const input: LeadInput = {
    phone: normalizedPhone,
    source: source as LeadSource,
    page,
    attribution,
    consent: true,
    photos
  };

  if (name) input.name = name;
  if (message) input.message = message;
  if (categorySlug) input.categorySlug = categorySlug;
  if (taskId) input.taskId = taskId;
  if (URGENCIES.includes(urgency as Urgency)) input.urgency = urgency as Urgency;
  if (LOCATIONS.includes(location as Location)) input.location = location as Location;
  if (estimateFrom !== undefined) input.estimateFrom = estimateFrom;
  if (estimateTo !== undefined) input.estimateTo = estimateTo;

  return { ok: true, input };
}
