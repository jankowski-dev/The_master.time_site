import { describe, it, expect, vi } from 'vitest';
import { track } from '@/lib/analytics';

describe('analytics', () => {
  it('pushes to dataLayer and calls ym and gtag', () => {
    const ym = vi.fn();
    const gtag = vi.fn();
    const dataLayer: Array<Record<string, unknown>> = [];

    track('phone_click', { placement: 'header' }, { dataLayer, ym, gtag, __tmtYmId: '112934654' });

    expect(dataLayer).toEqual([{ event: 'phone_click', placement: 'header' }]);
    expect(ym).toHaveBeenCalledWith('112934654', 'reachGoal', 'phone_click', { placement: 'header' });
    expect(gtag).toHaveBeenCalledWith('event', 'phone_click', { placement: 'header' });
  });

  it('does not throw when ym and gtag are missing', () => {
    const dataLayer: Array<Record<string, unknown>> = [];
    expect(() => track('phone_click', { placement: 'header' }, { dataLayer })).not.toThrow();
    expect(dataLayer).toEqual([{ event: 'phone_click', placement: 'header' }]);
  });

  it('defaults params to empty object', () => {
    const dataLayer: Array<Record<string, unknown>> = [];
    track('page_view', undefined, { dataLayer });
    expect(dataLayer).toEqual([{ event: 'page_view' }]);
  });

  it('is a no-op without a window', () => {
    expect(() => track('phone_click')).not.toThrow();
  });

  it('uses the global window when win is omitted', () => {
    const dataLayer: Array<Record<string, unknown>> = [];
    const ym = vi.fn();
    const gtag = vi.fn();
    const fake = { dataLayer, ym, gtag, __tmtYmId: '112934654' };
    vi.stubGlobal('window', fake);
    try {
      track('phone_click', { placement: 'header' });
      expect(dataLayer).toEqual([{ event: 'phone_click', placement: 'header' }]);
      expect(ym).toHaveBeenCalledWith('112934654', 'reachGoal', 'phone_click', { placement: 'header' });
      expect(gtag).toHaveBeenCalledWith('event', 'phone_click', { placement: 'header' });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
