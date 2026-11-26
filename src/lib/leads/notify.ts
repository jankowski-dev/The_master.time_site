import { createEmailNotifier } from './email';
import { createTestNotifier } from './test-notifier';
import type { EmailConfig, Lead, LeadNotifier } from './types';
import { createViberNotifier } from './viber';
import type { ViberConfig } from './viber';

export interface NotifyResult {
  name: string;
  ok: boolean;
  error?: string;
}

export interface NotifyOutcome {
  delivered: boolean;
  results: NotifyResult[];
}

/**
 * Fans a lead out to every notifier. Delivery is considered successful when at
 * least one channel succeeds; individual failures never reject.
 */
export async function notifyLead(lead: Lead, notifiers: LeadNotifier[]): Promise<NotifyOutcome> {
  const settled = await Promise.allSettled(notifiers.map((notifier) => notifier.send(lead)));

  const results = settled.map<NotifyResult>((result, index) => {
    if (result.status === 'fulfilled') {
      return { name: notifiers[index].name, ok: true };
    }
    return {
      name: notifiers[index].name,
      ok: false,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason)
    };
  });

  return { delivered: results.some((result) => result.ok), results };
}

/**
 * Builds the active notifier set from configuration. Test mode yields a single
 * in-memory notifier; otherwise the email and Viber channels are included when
 * configured, with missing channels filtered out.
 */
export function createNotifiers(config: {
  testMode: boolean;
  email: EmailConfig | null;
  viber: ViberConfig | null;
}): LeadNotifier[] {
  if (config.testMode) {
    return [createTestNotifier()];
  }

  const notifiers: LeadNotifier[] = [];
  if (config.email) notifiers.push(createEmailNotifier(config.email));
  if (config.viber) {
    const viber = createViberNotifier(config.viber);
    if (viber) notifiers.push(viber);
  }
  return notifiers;
}
