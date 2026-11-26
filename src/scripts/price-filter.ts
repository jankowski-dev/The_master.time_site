import { track } from '@/lib/analytics';

type FilterElements = {
  search: HTMLInputElement;
  category: HTMLSelectElement;
  count: HTMLElement | null;
  empty: HTMLElement | null;
  groups: HTMLElement[];
};

const WORD_SPLIT = /[^a-zа-я0-9]+/;

/** Lowercases the query and folds ё so «е» and «ё» match each other. */
function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/ё/g, 'е');
}

/**
 * Trims common Russian endings so «смеситель» finds «смесителя»
 * and «розетка» finds «розетки».
 */
function stem(word: string): string {
  if (word.length < 4) return word;
  return word.replace(/[аеиоуыэюяйь]$/, '');
}

function toStems(value: string): string[] {
  return normalize(value)
    .split(WORD_SPLIT)
    .filter(Boolean)
    .map(stem);
}

function matchesQuery(text: string, query: string): boolean {
  const queryWords = toStems(query);
  if (queryWords.length === 0) return true;

  const textWords = toStems(text);
  return queryWords.every((queryWord) =>
    textWords.some((textWord) => textWord.startsWith(queryWord))
  );
}

function filterWorks({ search, category, count, empty, groups }: FilterElements): void {
  const query = search.value;  const slug = category.value;
  let visibleWorks = 0;

  for (const group of groups) {
    const matchesCategory = slug === '' || group.dataset.categorySlug === slug;
    const rows = Array.from(group.querySelectorAll<HTMLElement>('[data-work-search]'));
    let groupVisible = false;

    for (const row of rows) {
      const show = matchesCategory && matchesQuery(row.dataset.workSearch ?? '', query);

      row.hidden = !show;

      if (show) {
        visibleWorks += 1;
        groupVisible = true;
      }
    }

    group.hidden = !groupVisible;
  }

  if (count) {
    count.textContent = String(visibleWorks);
  }

  if (empty) {
    empty.hidden = visibleWorks > 0;
  }
}

/** Debounced `price_filter` event; collapses rapid keystrokes into one call. */
let priceTrackTimer: number | null = null;
function scheduleTrack(query: string, category: string): void {
  if (priceTrackTimer !== null) window.clearTimeout(priceTrackTimer);
  priceTrackTimer = window.setTimeout(() => {
    priceTrackTimer = null;
    track('price_filter', { query, category });
  }, 400);
}

function initPriceFilter(): void {
  const form = document.querySelector<HTMLFormElement>('[data-price-form]');
  const search = document.querySelector<HTMLInputElement>('[data-price-search]');
  const category = document.querySelector<HTMLSelectElement>('[data-price-category]');
  const reset = document.querySelector<HTMLButtonElement>('[data-price-reset]');

  if (!form || !search || !category) return;

  const elements: FilterElements = {
    search,
    category,
    count: document.querySelector<HTMLElement>('[data-price-count]'),
    empty: document.querySelector<HTMLElement>('[data-price-empty]'),
    groups: Array.from(document.querySelectorAll<HTMLElement>('[data-category-group]'))
  };

  const applyFilter = (): void => {
    filterWorks(elements);
    scheduleTrack(elements.search.value, elements.category.value);
  };

  search.addEventListener('input', applyFilter);
  category.addEventListener('change', applyFilter);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    applyFilter();
  });

  reset?.addEventListener('click', () => {
    search.value = '';
    category.value = '';
    applyFilter();
    search.focus();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPriceFilter);
} else {
  initPriceFilter();
}
