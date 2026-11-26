import type { Attribution } from '@/lib/attribution';
import { formatRange } from '@/lib/pricing/format';
import type { Location, Urgency } from '@/lib/pricing/types';
import type { Lead } from './types';

/** Escapes a string for safe inclusion in HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateMinsk(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Minsk',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function urgencyLabel(urgency?: Urgency): string | undefined {
  switch (urgency) {
    case 'asap':
      return 'Срочно';
    case 'this_week':
      return 'На этой неделе';
    case 'flexible':
      return 'Гибко';
    default:
      return undefined;
  }
}

function locationLabel(location?: Location): string | undefined {
  switch (location) {
    case 'city':
      return 'В городе';
    case 'out_of_town':
      return 'За городом';
    case 'beyond':
      return 'Дальше';
    default:
      return undefined;
  }
}

function estimateLabel(lead: Lead): string | undefined {
  if (lead.estimateFrom === undefined) return undefined;
  return formatRange(lead.estimateFrom, lead.estimateTo);
}

const ATTRIBUTION_LABELS: Array<[keyof Attribution, string]> = [
  ['utmSource', 'UTM Source'],
  ['utmMedium', 'UTM Medium'],
  ['utmCampaign', 'UTM Campaign'],
  ['utmTerm', 'UTM Term'],
  ['utmContent', 'UTM Content'],
  ['gclid', 'GCLID'],
  ['yclid', 'YCLID'],
  ['referrer', 'Referrer'],
  ['landingPage', 'Landing Page'],
  ['page', 'Page'],
  ['device', 'Device']
];

interface Row {
  label: string;
  value?: string;
}

function rows(lead: Lead): Row[] {
  const result: Row[] = [
    { label: 'ID', value: lead.id },
    { label: 'Дата', value: formatDateMinsk(lead.createdAt) },
    { label: 'Имя', value: lead.name },
    { label: 'Телефон', value: lead.phone },
    { label: 'Источник', value: lead.source },
    { label: 'Страница', value: lead.page },
    { label: 'Категория', value: lead.categorySlug },
    { label: 'Задача', value: lead.taskId },
    { label: 'Срочность', value: urgencyLabel(lead.urgency) },
    { label: 'Локация', value: locationLabel(lead.location) },
    { label: 'Оценка', value: estimateLabel(lead) },
    { label: 'Сообщение', value: lead.message },
    { label: 'Фото', value: String(lead.photos.length) }
  ];

  for (const [key, label] of ATTRIBUTION_LABELS) {
    const value = lead.attribution[key];
    if (value !== undefined && value !== '') {
      result.push({ label, value });
    }
  }

  return result;
}

function present(rows: Row[]): Row[] {
  return rows.filter((row) => row.value !== undefined && row.value !== '');
}

/** Plain-text representation of a lead for the email body. */
export function formatLeadText(lead: Lead): string {
  return present(rows(lead))
    .map((row) => `${row.label}: ${row.value}`)
    .join('\n');
}

/** HTML representation of a lead with all user-provided text escaped. */
export function formatLeadHtml(lead: Lead): string {
  const lines = present(rows(lead)).map(
    (row) => `<p><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value as string)}</p>`
  );
  return lines.join('\n');
}
