import { describe, it, expect } from 'vitest';
import { parseLeadFormData } from '@/lib/leads/validate';

const MB = 1024 * 1024;

function validForm(): FormData {
  const form = new FormData();
  form.set('phone', '+375 29 123-45-67');
  form.set('name', 'Иван');
  form.set('source', 'form');
  form.set('page', '/kalkulyator');
  form.set('consent', '1');
  form.set('startedAt', String(Date.now() - 5000));
  form.set('website', '');
  return form;
}

describe('parseLeadFormData', () => {
  it('accepts a valid form and normalizes the phone', async () => {
    const result = await parseLeadFormData(validForm());
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.input.phone).toBe('+375291234567');
    expect(result.input.name).toBe('Иван');
    expect(result.input.source).toBe('form');
    expect(result.input.consent).toBe(true);
    expect(result.input.photos).toEqual([]);
  });

  it('rejects a missing phone', async () => {
    const form = validForm();
    form.delete('phone');
    const result = await parseLeadFormData(form);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.errors.phone).toBeTruthy();
  });

  it('rejects an invalid operator code', async () => {
    const form = validForm();
    form.set('phone', '+375111234567');
    const result = await parseLeadFormData(form);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.errors.phone).toBeTruthy();
  });

  it('rejects a missing consent', async () => {
    const form = validForm();
    form.delete('consent');
    const result = await parseLeadFormData(form);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.errors.consent).toBeTruthy();
  });

  it('rejects a filled honeypot', async () => {
    const form = validForm();
    form.set('website', 'spam');
    const result = await parseLeadFormData(form);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.errors.website).toBeTruthy();
  });

  it('rejects a startedAt that is too recent', async () => {
    const form = validForm();
    form.set('startedAt', String(Date.now() - 1000));
    const result = await parseLeadFormData(form);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.errors.startedAt).toBeTruthy();
  });

  it('allows an absent startedAt (no-JS fallback)', async () => {
    const form = validForm();
    form.delete('startedAt');
    const result = await parseLeadFormData(form);
    expect(result.ok).toBe(true);
  });

  it('rejects four photos', async () => {
    const form = validForm();
    for (let i = 0; i < 4; i++) {
      form.append('photos', new File(['x'], `p${i}.jpg`, { type: 'image/jpeg' }));
    }
    const result = await parseLeadFormData(form);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.errors.photos).toBe('Не более 3 фото');
  });

  it('rejects a non-image file', async () => {
    const form = validForm();
    form.append('photos', new File(['hello'], 'doc.txt', { type: 'text/plain' }));
    const result = await parseLeadFormData(form);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.errors.photos).toBe('Только фото');
  });

  it('rejects a 5MB file', async () => {
    const form = validForm();
    const buffer = Buffer.alloc(5 * MB);
    form.append('photos', new File([buffer], 'big.jpg', { type: 'image/jpeg' }));
    const result = await parseLeadFormData(form);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.errors.photos).toBe('Файл больше 4 МБ');
  });

  it('falls back to {} for invalid attribution JSON', async () => {
    const form = validForm();
    form.set('attribution', 'not-json{');
    const result = await parseLeadFormData(form);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.input.attribution).toEqual({});
  });

  it('parses valid attribution JSON', async () => {
    const form = validForm();
    form.set('attribution', JSON.stringify({ utmSource: 'instagram' }));
    const result = await parseLeadFormData(form);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.input.attribution).toEqual({ utmSource: 'instagram' });
  });

  it('drops non-string attribution values', async () => {
    const form = validForm();
    form.set('attribution', JSON.stringify({ utmSource: 123, utmMedium: 'cpc', gclid: null }));
    const result = await parseLeadFormData(form);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.input.attribution).toEqual({ utmMedium: 'cpc' });
  });

  it('rejects a 100-char name', async () => {
    const form = validForm();
    form.set('name', 'a'.repeat(100));
    const result = await parseLeadFormData(form);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.errors.name).toBeTruthy();
  });

  it('converts photos to LeadPhoto buffers', async () => {
    const form = validForm();
    form.append('photos', new File(['abc'], 'photo.jpg', { type: 'image/jpeg' }));
    const result = await parseLeadFormData(form);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.input.photos).toHaveLength(1);
    const photo = result.input.photos[0];
    expect(photo.filename).toBe('photo.jpg');
    expect(photo.contentType).toBe('image/jpeg');
    expect(photo.size).toBe(3);
    expect(Buffer.from(photo.content).toString()).toBe('abc');
  });
});
