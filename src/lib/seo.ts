export const BRAND = 'The Master Time';

export interface SeoProps {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  noindex?: boolean;
  type?: string;
}

/** Appends the brand unless the title already contains it. */
export function buildTitle(title: string): string {
  if (title.includes(BRAND)) return title;
  return `${title} | ${BRAND}`;
}

/** Resolves a path against the site origin to an absolute URL. */
export function absoluteUrl(path: string, site: string): string {
  return new URL(path, site).toString();
}
