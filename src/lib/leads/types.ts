import type { Attribution } from '@/lib/attribution';
import type { Location, Urgency } from '@/lib/pricing/types';

export type LeadSource = 'form' | 'calculator' | 'callback';

export interface LeadPhoto {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
}

export interface LeadInput {
  name?: string;
  phone: string;
  message?: string;
  categorySlug?: string;
  taskId?: string;
  urgency?: Urgency;
  location?: Location;
  estimateFrom?: number;
  estimateTo?: number;
  source: LeadSource;
  page: string;
  attribution: Attribution;
  consent: boolean;
  photos: LeadPhoto[];
}

export interface Lead extends LeadInput {
  id: string;
  createdAt: string;
}

export interface LeadNotifier {
  name: string;
  send(lead: Lead): Promise<void>;
}

export type LeadParseResult =
  | { ok: true; input: LeadInput }
  | { ok: false; errors: Record<string, string> };

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
}

export type SendMail = (message: unknown) => Promise<unknown>;
