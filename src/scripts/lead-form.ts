import { track } from '@/lib/analytics';
import { captureAttribution, getAttribution } from '@/lib/attribution';
import { normalizeBelarusPhone } from '@/lib/phone';

const PHONE_LINK = 'tel:+375257076793';
const PHONE_DISPLAY = '+375 25 707-67-93';
const VIBER_LINK = 'viber://chat?number=%2B375257076793';
const INSTAGRAM_DM = 'https://ig.me/m/the_master.time';

const ERROR_PHONE = 'Укажите корректный номер телефона';
const ERROR_CONSENT = 'Необходимо согласие на обработку данных';

function device(): 'mobile' | 'desktop' {
  return window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop';
}

function named(
  form: HTMLFormElement,
  name: string
): HTMLInputElement | HTMLTextAreaElement | null {
  return form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
}

function clearErrors(form: HTMLFormElement): void {
  for (const el of form.querySelectorAll('[data-dynamic-error]')) el.remove();
  for (const control of form.querySelectorAll<HTMLElement>('[aria-invalid="true"]')) {
    control.removeAttribute('aria-invalid');
  }
}

function setFieldError(form: HTMLFormElement, name: string, message: string): void {
  const wrapper = form.querySelector(`[data-field="${name}"]`);
  if (!wrapper) return;
  let errorEl = wrapper.querySelector<HTMLElement>('[data-dynamic-error]');
  if (!errorEl) {
    errorEl = document.createElement('p');
    errorEl.className = 'field__error';
    errorEl.dataset.dynamicError = '';
    errorEl.setAttribute('role', 'alert');
    wrapper.append(errorEl);
  }
  errorEl.textContent = message;
  const control = wrapper.querySelector<HTMLElement>('input, textarea');
  control?.setAttribute('aria-invalid', 'true');
}

function setLoading(form: HTMLFormElement, loading: boolean): void {
  const submit = form.querySelector<HTMLButtonElement>('[data-lead-submit]');
  const spinner = form.querySelector<HTMLElement>('[data-lead-spinner]');
  if (submit) submit.disabled = loading;
  if (spinner) spinner.hidden = !loading;
}

function clearStatus(form: HTMLFormElement): void {
  const status = form.querySelector<HTMLElement>('[data-lead-status]');
  if (!status) return;
  status.hidden = true;
  status.textContent = '';
}

function renderSuccess(form: HTMLFormElement): void {
  const fields = form.querySelector<HTMLElement>('[data-lead-fields]');
  const status = form.querySelector<HTMLElement>('[data-lead-status]');
  if (fields) fields.hidden = true;
  if (!status) return;
  status.textContent = '';
  status.hidden = false;

  const title = document.createElement('h3');
  title.className = 'lead-form__success-title';
  title.textContent = 'Заявка принята';

  const text = document.createElement('p');
  text.textContent = 'Спасибо! Скоро свяжусь с вами, чтобы уточнить детали.';

  const instagram = document.createElement('a');
  instagram.href = INSTAGRAM_DM;
  instagram.target = '_blank';
  instagram.rel = 'noopener noreferrer';
  instagram.textContent = 'Написать в Instagram';

  status.append(title, text, instagram);
}

function renderFailure(form: HTMLFormElement): void {
  const status = form.querySelector<HTMLElement>('[data-lead-status]');
  if (!status) return;
  status.textContent = '';
  status.hidden = false;

  const text = document.createElement('p');
  text.textContent = 'Не удалось отправить заявку. Позвоните или напишите:';

  const phone = document.createElement('a');
  phone.href = PHONE_LINK;
  phone.textContent = PHONE_DISPLAY;

  const viber = document.createElement('a');
  viber.href = VIBER_LINK;
  viber.textContent = 'Написать в Viber';

  status.append(text, phone, viber);
}

function bindSubmit(form: HTMLFormElement): void {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors(form);
    clearStatus(form);

    const phoneInput = named(form, 'phone') as HTMLInputElement | null;
    const consent = named(form, 'consent') as HTMLInputElement | null;

    const phone = phoneInput ? normalizeBelarusPhone(phoneInput.value) : null;
    let firstInvalid: HTMLElement | null = null;

    if (!phone) {
      setFieldError(form, 'phone', ERROR_PHONE);
      firstInvalid = phoneInput;
    }
    if (!consent?.checked) {
      setFieldError(form, 'consent', ERROR_CONSENT);
      firstInvalid = firstInvalid ?? consent;
    }

    if (!phone || !consent?.checked) {
      track('lead_error', { reason: 'validation' });
      firstInvalid?.focus();
      return;
    }

    const formData = new FormData(form);
    formData.set('phone', phone as string);
    formData.set('page', window.location.pathname);
    formData.set('attribution', JSON.stringify(getAttribution(window.localStorage, window.location.pathname, device())));

    const source = String(formData.get('source') ?? 'form');
    track('lead_submit', { source });
    setLoading(form, true);

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        body: formData,
        headers: { 'X-Requested-With': 'fetch' }
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean } | null;

      if (response.ok && data?.ok) {
        renderSuccess(form);
      } else {
        renderFailure(form);
        track('lead_error', { reason: 'server', status: response.status });
      }
    } catch {
      renderFailure(form);
      track('lead_error', { reason: 'network' });
    } finally {
      setLoading(form, false);
    }
  });
}

function initLeadForms(): void {
  captureAttribution(
    window.location.search,
    document.referrer,
    window.location.pathname,
    window.localStorage
  );

  for (const form of document.querySelectorAll<HTMLFormElement>('[data-lead-form]')) {
    if (form.dataset.leadBound) continue;
    form.dataset.leadBound = '1';

    const page = named(form, 'page');
    if (page && !page.value) page.value = window.location.pathname;

    const startedAt = named(form, 'startedAt');
    if (startedAt && !startedAt.value) startedAt.value = String(Date.now());

    bindSubmit(form);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLeadForms);
} else {
  initLeadForms();
}
