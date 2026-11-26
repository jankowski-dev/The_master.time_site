import type { LeadNotifier } from './types';

/**
 * A no-op notifier used when `LEAD_TEST_MODE=1`. It makes no external calls so
 * end-to-end tests can submit leads without SMTP or Viber credentials.
 */
export function createTestNotifier(): LeadNotifier {
  return {
    name: 'memory',
    async send(): Promise<void> {
      // Intentionally does nothing.
    }
  };
}
