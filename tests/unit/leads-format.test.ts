import { describe, it, expect } from 'vitest';
import { escapeHtml, formatLeadHtml, formatLeadText } from '@/lib/leads/format';
import type { Lead } from '@/lib/leads/types';

function lead(): Lead {
  return {
    id: 'lead-1',
    createdAt: '2026-11-26T10:00:00.000Z',
    name: '<script>alert(1)</script>',
    phone: '+375291234567',
    message: 'Течёт кран',
    source: 'calculator',
    page: '/kalkulyator',
    attribution: { utmSource: 'instagram' },
    consent: true,
    photos: [],
    estimateFrom: 40,
    estimateTo: 60,
    urgency: 'asap',
    location: 'city'
  };
}

describe('escapeHtml', () => {
  it('escapes the special characters', () => {
    expect(escapeHtml('<script>"&\'</script>')).toBe(
      '&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;'
    );
  });
});

describe('formatLeadHtml', () => {
  it('escapes user text and never emits a raw script tag', () => {
    const html = formatLeadHtml(lead());
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('formatLeadText', () => {
  it('includes phone, source and estimate', () => {
    const text = formatLeadText(lead());
    expect(text).toContain('+375291234567');
    expect(text).toContain('calculator');
    expect(text).toContain('40');
    expect(text).toContain('60');
  });
});
