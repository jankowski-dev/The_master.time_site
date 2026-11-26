import type { Estimate, EstimateInput, EstimateLine } from './types';

const WORK_LINE_LABEL = 'Работа';
const URGENT_LINE_LABEL = 'Срочность';
const OUT_OF_TOWN_LINE_LABEL = 'За городом';
const DIAGNOSTICS_LINE_LABEL = 'Диагностика';
const DIAGNOSTICS_WAIVED_LINE_LABEL = 'Диагностика (зачитывается)';

/**
 * Builds a transparent BYN estimate from a calculator task / work and the
 * selected urgency and location. Pure: no DOM or I/O.
 */
export function calculateEstimate(input: EstimateInput): Estimate {
  const { task, work, pricing, urgency, location } = input;

  // Base comes from the task override when present, otherwise the linked work.
  const baseFrom = task.priceFrom ?? work.priceFrom;
  const baseTo = task.priceTo ?? work.priceTo;
  const duration = task.duration ?? work.duration;

  const lines: EstimateLine[] = [];
  const workLine: EstimateLine = { label: WORK_LINE_LABEL, from: baseFrom };
  if (baseTo !== undefined) workLine.to = baseTo;
  lines.push(workLine);

  // Beyond the service radius we cannot price reliably: return the base only.
  if (location === 'beyond') {
    const from = Math.ceil(baseFrom);
    const to = baseTo === undefined ? undefined : Math.ceil(baseTo);
    return {
      currency: 'BYN',
      from,
      to,
      isRange: to !== undefined && to !== from,
      requiresPhone: true,
      minOrderApplied: false,
      duration,
      lines,
      notice: `Выезд за пределы ${pricing.outOfTownRadiusKm} км — стоимость уточняется по телефону.`,
      disclaimer: pricing.disclaimer
    };
  }

  let from = baseFrom;
  let to = baseTo;

  if (urgency === 'asap') {
    const factor = pricing.urgentSurchargePercent / 100;
    const urgentDeltaFrom = baseFrom * factor;
    from += urgentDeltaFrom;
    const urgentLine: EstimateLine = { label: URGENT_LINE_LABEL, from: urgentDeltaFrom };
    if (to !== undefined) {
      const urgentDeltaTo = to * factor;
      to += urgentDeltaTo;
      urgentLine.to = urgentDeltaTo;
    }
    lines.push(urgentLine);
  }

  if (location === 'out_of_town') {
    from += pricing.outOfTownFee;
    if (to !== undefined) to += pricing.outOfTownFee;
    lines.push({
      label: OUT_OF_TOWN_LINE_LABEL,
      from: pricing.outOfTownFee,
      to: pricing.outOfTownFee
    });
  }

  const minOrderApplied = from < pricing.minOrder || (to !== undefined && to < pricing.minOrder);
  from = Math.max(pricing.minOrder, from);
  if (to !== undefined) to = Math.max(pricing.minOrder, to);

  if (pricing.diagnosticsFee > 0) {
    if (pricing.diagnosticsWaivedOnWork) {
      lines.push({ label: DIAGNOSTICS_WAIVED_LINE_LABEL, from: 0, to: 0 });
    } else {
      from += pricing.diagnosticsFee;
      if (to !== undefined) to += pricing.diagnosticsFee;
      lines.push({
        label: DIAGNOSTICS_LINE_LABEL,
        from: pricing.diagnosticsFee,
        to: pricing.diagnosticsFee
      });
    }
  }

  from = Math.ceil(from);
  if (to !== undefined) to = Math.ceil(to);

  return {
    currency: 'BYN',
    from,
    to,
    isRange: to !== undefined && to !== from,
    requiresPhone: false,
    minOrderApplied,
    duration,
    lines,
    disclaimer: pricing.disclaimer
  };
}
