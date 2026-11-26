export interface AnalyticsWindow {
  dataLayer: Array<Record<string, unknown>>;
  ym?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
  __tmtYmId?: string;
}

/**
 * Sends an analytics event to GTM's dataLayer, Yandex Metrika and gtag.
 * Pushes no PII and never throws, even when the trackers are absent.
 */
export function track(
  event: string,
  params: Record<string, unknown> = {},
  win?: AnalyticsWindow
): void {
  if (!win) return;
  try {
    win.dataLayer.push({ event, ...params });

    if (typeof win.ym === 'function') {
      win.ym(win.__tmtYmId, 'reachGoal', event, params);
    }
    if (typeof win.gtag === 'function') {
      win.gtag('event', event, params);
    }
  } catch {
    // analytics must never break the app
  }
}
