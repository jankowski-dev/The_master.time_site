import { track } from '@/lib/analytics';

/**
 * Delegated click tracking for `[data-track]` elements.
 *
 * Reads the event name from `data-track-event` and an optional JSON object
 * from `data-track-params` (parsed defensively).
 */
function initTracking(): void {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const el = target.closest('[data-track]');
    if (!el) return;

    const eventName = el.getAttribute('data-track-event');
    if (!eventName) return;

    let params: Record<string, unknown> = {};
    const raw = el.getAttribute('data-track-params');
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          params = parsed as Record<string, unknown>;
        }
      } catch {
        params = {};
      }
    }

    track(eventName, params);
  });
}

/**
 * Delegated FAQ-open tracking. The native `<details>` `toggle` event does not
 * bubble, so this listener is registered in the capture phase and scoped to
 * `details[data-faq-item]` to avoid firing for the header's nav dropdown.
 */
function initFaqTracking(): void {
  document.addEventListener(
    'toggle',
    (event) => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !details.open) return;
      if (!details.closest('[data-faq-item]')) return;
      const question = details.querySelector('summary')?.textContent?.trim() ?? '';
      track('faq_open', { question });
    },
    true
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initTracking();
    initFaqTracking();
  });
} else {
  initTracking();
  initFaqTracking();
}
