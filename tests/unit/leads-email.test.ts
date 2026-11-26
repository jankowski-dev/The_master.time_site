import { describe, it, expect, vi } from 'vitest';
import { createEmailNotifier } from '@/lib/leads/email';
import type { EmailConfig } from '@/lib/leads/types';
import type { Lead } from '@/lib/leads/types';

function lead(): Lead {
  return {
    id: 'lead-1',
    createdAt: '2026-11-26T10:00:00.000Z',
    name: 'Иван',
    phone: '+375291234567',
    source: 'form',
    page: '/kalkulyator',
    attribution: {},
    consent: true,
    photos: [
      {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        size: 3,
        content: Buffer.from('abc')
      }
    ]
  };
}

const config: EmailConfig = {
  host: 'smtp.example.com',
  port: 587,
  user: 'user',
  pass: 'pass',
  from: 'from@example.com',
  to: 'to@example.com'
};

describe('createEmailNotifier', () => {
  it('sends a lead email with the right fields and attachments', async () => {
    const messages: unknown[] = [];
    const sendMail = vi.fn(async (message: unknown) => {
      messages.push(message);
    });

    const notifier = createEmailNotifier(config, sendMail);
    expect(notifier.name).toBe('email');
    await notifier.send(lead());

    expect(sendMail).toHaveBeenCalledTimes(1);
    const message = messages[0] as Record<string, unknown>;
    expect(message.to).toBe('to@example.com');
    expect(message.from).toBe('from@example.com');
    expect(message.subject).toContain('Новая заявка');
    expect(message.subject).toContain('+375291234567');
    expect(message.attachments).toHaveLength(1);
    const attachment = (message.attachments as Array<Record<string, unknown>>)[0];
    expect(attachment.filename).toBe('photo.jpg');
    expect(attachment.contentType).toBe('image/jpeg');
    expect(Buffer.from(attachment.content as Uint8Array).toString()).toBe('abc');
  });

  it('throws when sendMail rejects', async () => {
    const sendMail = vi.fn(async () => {
      throw new Error('smtp down');
    });
    const notifier = createEmailNotifier(config, sendMail);
    await expect(notifier.send(lead())).rejects.toThrow('smtp down');
  });
});
