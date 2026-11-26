import { track } from '@/lib/analytics';
import { calculateEstimate } from '@/lib/pricing/calculate';
import { formatPrice, formatRange } from '@/lib/pricing/format';
import type { CalculatorTask, PricingConfig, Work } from '@/lib/content/schemas';
import type { Estimate, EstimateLine, Location, Urgency } from '@/lib/pricing/types';

interface CategoryMeta {
  slug: string;
  title: string;
  icon: string;
}

interface CalculatorData {
  categories: CategoryMeta[];
  tasks: CalculatorTask[];
  works: Work[];
  pricing: PricingConfig;
}

interface State {
  step: 1 | 2 | 3;
  categorySlug: string | null;
  taskId: string | null;
  urgency: Urgency;
  location: Location;
}

const URGENCY_VALUES: Urgency[] = ['asap', 'this_week', 'flexible'];
const LOCATION_VALUES: Location[] = ['city', 'out_of_town', 'beyond'];
const DEFAULT_URGENCY: Urgency = 'this_week';
const DEFAULT_LOCATION: Location = 'city';

const PHONE_NOTE = 'Уточним по телефону';

function isUrgency(value: string | null): value is Urgency {
  return URGENCY_VALUES.includes(value as Urgency);
}

function isLocation(value: string | null): value is Location {
  return LOCATION_VALUES.includes(value as Location);
}

function readData(): CalculatorData | null {
  const el = document.getElementById('calculator-data');
  if (!el) return null;
  try {
    return JSON.parse(el.textContent ?? '') as CalculatorData;
  } catch {
    return null;
  }
}

function readUrlState(data: CalculatorData): Pick<State, 'categorySlug' | 'taskId' | 'urgency' | 'location'> {
  const params = new URLSearchParams(window.location.search);
  const categorySlug = params.get('category');
  const taskId = params.get('task');
  const urgency = params.get('urgency');
  const location = params.get('location');

  const categoryValid = !!categorySlug && data.categories.some((c) => c.slug === categorySlug);
  const taskValid =
    !!taskId && data.tasks.some((t) => t.id === taskId && t.categorySlug === categorySlug);

  if (categoryValid && taskValid) {
    return {
      categorySlug: categorySlug as string,
      taskId: taskId as string,
      urgency: isUrgency(urgency) ? urgency : DEFAULT_URGENCY,
      location: isLocation(location) ? location : DEFAULT_LOCATION
    };
  }

  return {
    categorySlug: null,
    taskId: null,
    urgency: DEFAULT_URGENCY,
    location: DEFAULT_LOCATION
  };
}

function formatLineAmount(line: EstimateLine): string {
  if (line.to !== undefined && line.to !== line.from) {
    return formatRange(line.from, line.to);
  }
  return formatPrice(line.from);
}

function buildPriceResult(estimate: Estimate, minOrder: number): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'calc-result__body';

  const price = document.createElement('p');
  price.className = 'calc-result__price';
  price.textContent = formatRange(estimate.from, estimate.to);
  wrap.append(price);

  if (estimate.duration) {
    const duration = document.createElement('p');
    duration.className = 'calc-result__duration';
    duration.textContent = `Примерное время: ${estimate.duration}`;
    wrap.append(duration);
  }

  if (estimate.minOrderApplied) {
    const note = document.createElement('p');
    note.className = 'calc-result__note';
    note.textContent = `Применён минимальный заказ — ${formatPrice(minOrder)}`;
    wrap.append(note);
  }

  if (estimate.lines.length > 0) {
    const list = document.createElement('ul');
    list.className = 'calc-result__lines';
    for (const line of estimate.lines) {
      const item = document.createElement('li');
      item.className = 'calc-result__line';

      const label = document.createElement('span');
      label.className = 'calc-result__line-label';
      label.textContent = line.label;

      const amount = document.createElement('span');
      amount.className = 'calc-result__line-amount';
      amount.textContent = formatLineAmount(line);

      item.append(label, amount);
      list.append(item);
    }
    wrap.append(list);
  }

  const disclaimer = document.createElement('p');
  disclaimer.className = 'calc-result__disclaimer';
  disclaimer.textContent = estimate.disclaimer;
  wrap.append(disclaimer);

  return wrap;
}

function buildPhoneResult(estimate: Estimate): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'calc-result__body';

  const headline = document.createElement('p');
  headline.className = 'calc-result__phone-note';
  headline.textContent = PHONE_NOTE;
  wrap.append(headline);

  if (estimate.notice) {
    const notice = document.createElement('p');
    notice.className = 'calc-result__notice';
    notice.textContent = estimate.notice;
    wrap.append(notice);
  }

  const disclaimer = document.createElement('p');
  disclaimer.className = 'calc-result__disclaimer';
  disclaimer.textContent = estimate.disclaimer;
  wrap.append(disclaimer);

  return wrap;
}

function initCalculator(): void {
  const data = readData();
  const root = document.querySelector<HTMLElement>('[data-calculator]');
  if (!data || !root) return;

  const taskById = new Map(data.tasks.map((task) => [task.id, task]));
  const workById = new Map(data.works.map((work) => [work.id, work]));

  const progressEl = root.querySelector<HTMLElement>('[data-calc-progress]');
  const stepSections = Array.from(root.querySelectorAll<HTMLElement>('[data-calc-step]'));
  const backBtn = root.querySelector<HTMLButtonElement>('[data-calc-back]');
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-calc-next]');
  const taskList = root.querySelector<HTMLElement>('[data-calc-task-list]');
  const emptyEl = root.querySelector<HTMLElement>('[data-calculator-empty]');
  const resultEl = root.querySelector<HTMLElement>('[data-calculator-result]');
  const ctaBtn = root.querySelector<HTMLButtonElement>('[data-calculator-cta]');
  const callLink = root.querySelector<HTMLElement>('[data-calculator-call]');

  const categoryInputs = Array.from(root.querySelectorAll<HTMLInputElement>('input[name="category"]'));
  const taskInputs = Array.from(root.querySelectorAll<HTMLInputElement>('input[name="task"]'));
  const urgencyInputs = Array.from(root.querySelectorAll<HTMLInputElement>('input[name="urgency"]'));
  const locationInputs = Array.from(root.querySelectorAll<HTMLInputElement>('input[name="location"]'));

  const urlState = readUrlState(data);
  const state: State = {
    step: urlState.categorySlug && urlState.taskId ? 3 : 1,
    categorySlug: urlState.categorySlug,
    taskId: urlState.taskId,
    urgency: urlState.urgency,
    location: urlState.location
  };

  const fired = new Set<string>();

  const fireOnce = (event: string, params: Record<string, unknown> = {}): void => {
    if (fired.has(event)) return;
    fired.add(event);
    track(event, params);
  };

  const syncInputs = (): void => {
    for (const input of categoryInputs) input.checked = input.value === state.categorySlug;
    for (const input of taskInputs) input.checked = input.value === state.taskId;
    for (const input of urgencyInputs) input.checked = input.value === state.urgency;
    for (const input of locationInputs) input.checked = input.value === state.location;
  };

  const filterTasks = (): void => {
    let visible = 0;
    for (const option of taskList?.querySelectorAll<HTMLElement>('[data-task-option]') ?? []) {
      const match = option.getAttribute('data-category') === state.categorySlug;
      option.hidden = !match;
      if (match) visible += 1;
    }
    if (emptyEl) emptyEl.hidden = state.categorySlug === null || visible > 0;
  };

  const updateNav = (): void => {
    if (nextBtn) {
      if (state.step === 1) nextBtn.disabled = state.categorySlug === null;
      if (state.step === 2) nextBtn.disabled = state.taskId === null;
    }
  };

  const updateUrl = (): void => {
    const params = new URLSearchParams();
    if (state.categorySlug) params.set('category', state.categorySlug);
    if (state.taskId) params.set('task', state.taskId);
    if (state.step === 3) {
      params.set('urgency', state.urgency);
      params.set('location', state.location);
    }
    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  };

  const currentEstimate = (): Estimate | null => {
    if (!state.categorySlug || !state.taskId) return null;
    const task = taskById.get(state.taskId);
    if (!task) return null;
    const work = workById.get(task.workId);
    if (!work) return null;
    return calculateEstimate({
      task,
      work,
      pricing: data.pricing,
      urgency: state.urgency,
      location: state.location
    });
  };

  const buildMessage = (estimate: Estimate): string => {
    const task = state.taskId ? taskById.get(state.taskId) : undefined;
    const category = state.categorySlug
      ? data.categories.find((c) => c.slug === state.categorySlug)
      : undefined;
    const parts = [`${category?.title ?? ''} — ${task?.label ?? ''}`.trim()];
    if (estimate.requiresPhone) {
      parts.push('цена уточняется по телефону');
    } else {
      parts.push(`ориентировочно ${formatRange(estimate.from, estimate.to)}`);
    }
    return parts.filter(Boolean).join('. ');
  };

  const renderResult = (): void => {
    const estimate = currentEstimate();
    if (!estimate || !resultEl) {
      if (resultEl) resultEl.hidden = true;
      if (ctaBtn) ctaBtn.hidden = true;
      if (callLink) callLink.hidden = true;
      return;
    }

    resultEl.textContent = '';
    resultEl.hidden = false;

    if (estimate.requiresPhone) {
      resultEl.append(buildPhoneResult(estimate));
      if (ctaBtn) ctaBtn.hidden = true;
      if (callLink) callLink.hidden = false;
    } else {
      resultEl.append(buildPriceResult(estimate, data.pricing.minOrder));
      if (ctaBtn) ctaBtn.hidden = false;
      if (callLink) callLink.hidden = true;
    }

    fireOnce('calculator_result', {
      taskId: state.taskId ?? '',
      urgency: state.urgency,
      location: state.location,
      requiresPhone: estimate.requiresPhone
    });
  };

  const renderStep = (focus: boolean): void => {
    for (const section of stepSections) {
      section.hidden = Number(section.getAttribute('data-calc-step')) !== state.step;
    }
    if (progressEl) progressEl.textContent = String(state.step);
    if (backBtn) backBtn.hidden = state.step === 1;
    if (nextBtn) nextBtn.hidden = state.step === 3;
    updateNav();

    if (focus) {
      const section = stepSections.find(
        (el) => Number(el.getAttribute('data-calc-step')) === state.step
      );
      section?.querySelector<HTMLElement>('.calc-step__title')?.focus({ preventScroll: true });
    }

    const eventName = `calculator_step_${state.step}`;
    fireOnce(eventName);
  };

  const goNext = (): void => {
    if (state.step === 1) {
      state.step = 2;
      renderStep(true);
      updateUrl();
      return;
    }
    if (state.step === 2) {
      state.step = 3;
      renderStep(true);
      renderResult();
      updateUrl();
    }
  };

  const goBack = (): void => {
    if (state.step === 3) {
      state.step = 2;
      renderStep(true);
      updateUrl();
      return;
    }
    if (state.step === 2) {
      state.step = 1;
      renderStep(true);
      updateUrl();
    }
  };

  // Wire up the inputs.
  for (const input of categoryInputs) {
    input.addEventListener('change', () => {
      if (!input.checked) return;
      fireOnce('calculator_start');
      state.categorySlug = input.value;
      state.taskId = null;
      for (const taskInput of taskInputs) taskInput.checked = false;
      filterTasks();
      updateNav();
      updateUrl();
    });
  }

  for (const input of taskInputs) {
    input.addEventListener('change', () => {
      if (!input.checked) return;
      state.taskId = input.value;
      updateNav();
      updateUrl();
    });
  }

  for (const input of urgencyInputs) {
    input.addEventListener('change', () => {
      if (!input.checked || !isUrgency(input.value)) return;
      state.urgency = input.value;
      if (state.step === 3) renderResult();
      updateUrl();
    });
  }

  for (const input of locationInputs) {
    input.addEventListener('change', () => {
      if (!input.checked || !isLocation(input.value)) return;
      state.location = input.value;
      if (state.step === 3) renderResult();
      updateUrl();
    });
  }

  backBtn?.addEventListener('click', goBack);
  nextBtn?.addEventListener('click', goNext);

  ctaBtn?.addEventListener('click', () => {
    const estimate = currentEstimate();
    if (!estimate || estimate.requiresPhone) return;
    window.dispatchEvent(
      new CustomEvent('tmt:open-lead-form', {
        detail: {
          source: 'calculator',
          categorySlug: state.categorySlug,
          taskId: state.taskId,
          urgency: state.urgency,
          location: state.location,
          estimateFrom: estimate.from,
          estimateTo: estimate.to,
          message: buildMessage(estimate)
        }
      })
    );
  });

  // Initial render.
  syncInputs();
  filterTasks();
  renderStep(false);
  if (state.step === 3) renderResult();
  updateUrl();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalculator);
} else {
  initCalculator();
}
