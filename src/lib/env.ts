import type { EmailConfig } from '@/lib/leads/types';
import type { ViberConfig } from '@/lib/leads/viber';

export interface LeadConfig {
  testMode: boolean;
  email: EmailConfig | null;
  viber: ViberConfig | null;
}

function readEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : null;
}

/**
 * Reads lead-delivery configuration from the environment. Never throws at
 * build time: each channel is `null` unless every required value is present.
 */
export function getLeadConfig(): LeadConfig {
  const testMode = readEnv('LEAD_TEST_MODE') === '1';

  const host = readEnv('SMTP_HOST');
  const portRaw = readEnv('SMTP_PORT');
  const user = readEnv('SMTP_USER');
  const pass = readEnv('SMTP_PASS');
  const from = readEnv('MAIL_FROM');
  const to = readEnv('MAIL_TO');

  const port = portRaw !== null ? Number(portRaw) : NaN;
  const email: EmailConfig | null =
    host && portRaw && Number.isFinite(port) && user && pass && from && to
      ? { host, port, user, pass, from, to }
      : null;

  const token = readEnv('VIBER_AUTH_TOKEN');
  const adminId = readEnv('VIBER_ADMIN_ID');
  const viber: ViberConfig | null = token && adminId ? { token, adminId } : null;

  return { testMode, email, viber };
}
