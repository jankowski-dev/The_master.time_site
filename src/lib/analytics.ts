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
  const target =
    win ?? (typeof window !== 'undefined' ? (window as unknown as AnalyticsWindow) : undefined);
  if (!target) return;
  try {
    target.dataLayer.push({ event, ...params });

    if (typeof target.ym === 'function') {
      target.ym(target.__tmtYmId, 'reachGoal', event, params);
    }
    if (typeof target.gtag === 'function') {
      target.gtag('event', event, params);
    }
  } catch {
    // analytics must never break the app
  }
}
