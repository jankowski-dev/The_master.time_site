export const ATTRIBUTION_KEY = 'tmt_attribution';
export const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  yclid?: string;
  referrer?: string;
  landingPage?: string;
  page?: string;
  device?: 'mobile' | 'desktop';
}

interface StoredAttribution extends Attribution {
  expiresAt: number;
}

function parseAttribution(search: string): Attribution {
  const params = new URLSearchParams(search);
  const attribution: Attribution = {};

  const utmSource = params.get('utm_source');
  if (utmSource) attribution.utmSource = utmSource;
  const utmMedium = params.get('utm_medium');
  if (utmMedium) attribution.utmMedium = utmMedium;
  const utmCampaign = params.get('utm_campaign');
  if (utmCampaign) attribution.utmCampaign = utmCampaign;
  const utmTerm = params.get('utm_term');
  if (utmTerm) attribution.utmTerm = utmTerm;
  const utmContent = params.get('utm_content');
  if (utmContent) attribution.utmContent = utmContent;
  const gclid = params.get('gclid');
  if (gclid) attribution.gclid = gclid;
  const yclid = params.get('yclid');
  if (yclid) attribution.yclid = yclid;

  return attribution;
}

function hasAttribution(attribution: Attribution): boolean {
  return Object.keys(attribution).length > 0;
}

function readStored(storage: Storage, now: number): Attribution {
  try {
    const raw = storage.getItem(ATTRIBUTION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<StoredAttribution>;
    if (typeof parsed !== 'object' || parsed === null) return {};
    if (typeof parsed.expiresAt !== 'number' || parsed.expiresAt <= now) return {};
    const stored = { ...parsed };
    delete stored.expiresAt;
    return stored;
  } catch {
    return {};
  }
}

/**
 * Captures UTM/gclid/yclid attribution from a query string, stores it for
 * 30 days, and returns the captured fields. Keeps the existing stored
 * attribution when there is nothing new, and never throws.
 */
export function captureAttribution(
  search: string,
  referrer: string,
  landingPage: string,
  storage: Storage,
  now: number = Date.now()
): Attribution {
  const attribution = parseAttribution(search);

  if (hasAttribution(attribution)) {
    const full: Attribution = { ...attribution, referrer, landingPage };
    try {
      storage.setItem(
        ATTRIBUTION_KEY,
        JSON.stringify({ ...full, expiresAt: now + ATTRIBUTION_TTL_MS })
      );
      return full;
    } catch {
      return {};
    }
  }

  return readStored(storage, now);
}

/**
 * Returns the stored attribution plus the current `page` and `device`, or an
 * empty object when the entry is missing, expired or invalid.
 */
export function getAttribution(
  storage: Storage,
  page: string,
  device: 'mobile' | 'desktop',
  now: number = Date.now()
): Attribution {
  const stored = readStored(storage, now);
  if (!hasAttribution(stored)) return {};
  return { ...stored, page, device };
}
