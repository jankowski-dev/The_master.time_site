import { describe, it, expect } from 'vitest';
import { buildTitle, absoluteUrl } from '@/lib/seo';

describe('seo', () => {
  it('appends the brand', () => {
    expect(buildTitle('Услуги')).toBe('Услуги | The Master Time');
  });

  it('does not duplicate the brand', () => {
    expect(buildTitle('The Master Time — главная')).toBe('The Master Time — главная');
    expect(buildTitle('Мастер на час в Гродно — The Master Time')).toBe(
      'Мастер на час в Гродно — The Master Time'
    );
  });

  it('resolves absolute urls against the site origin', () => {
    expect(absoluteUrl('/uslugi', 'https://x.by')).toBe('https://x.by/uslugi');
    expect(absoluteUrl('/', 'https://x.by')).toBe('https://x.by/');
    expect(absoluteUrl('uslugi/santehnika', 'https://x.by/')).toBe('https://x.by/uslugi/santehnika');
  });
});
