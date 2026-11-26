import { describe, it, expect } from 'vitest';
import type { CalculatorTask, PricingConfig, Work } from '@/lib/content/schemas';
import { calculateEstimate } from '@/lib/pricing/calculate';

const pricing: PricingConfig = {
  currency: 'BYN',
  minOrder: 30,
  urgentSurchargePercent: 20,
  outOfTownFee: 20,
  outOfTownRadiusKm: 20,
  diagnosticsFee: 0,
  diagnosticsWaivedOnWork: true,
  disclaimer: 'Ориентировочно.'
};

const work: Work = {
  id: 'w',
  title: 'W',
  priceFrom: 40,
  priceTo: 60,
  unit: 'работа',
  includes: [],
  popular: false
};

const task: CalculatorTask = { id: 't', categorySlug: 's', label: 'T', workId: 'w' };

describe('calculateEstimate', () => {
  it('returns base range', () => {
    const e = calculateEstimate({ task, work, pricing, urgency: 'this_week', location: 'city' });
    expect(e).toMatchObject({
      from: 40,
      to: 60,
      isRange: true,
      requiresPhone: false,
      minOrderApplied: false
    });
  });

  it('applies urgent 20% to both bounds', () => {
    const e = calculateEstimate({ task, work, pricing, urgency: 'asap', location: 'city' });
    expect(e).toMatchObject({ from: 48, to: 72 });
  });

  it('adds out-of-town fee', () => {
    const e = calculateEstimate({ task, work, pricing, urgency: 'asap', location: 'out_of_town' });
    expect(e).toMatchObject({ from: 68, to: 92 });
  });

  it('keeps only "from" when no priceTo', () => {
    const e = calculateEstimate({
      task,
      work: { ...work, priceTo: undefined },
      pricing,
      urgency: 'asap',
      location: 'city'
    });
    expect(e.from).toBe(48);
    expect(e.to).toBeUndefined();
    expect(e.isRange).toBe(false);
  });

  it('clamps to min order after surcharges', () => {
    const e = calculateEstimate({
      task,
      work: { ...work, priceFrom: 10, priceTo: 20 },
      pricing,
      urgency: 'this_week',
      location: 'city'
    });
    expect(e).toMatchObject({ from: 30, to: 30, isRange: false, minOrderApplied: true });
  });

  it('adds diagnostics when not waived', () => {
    const e = calculateEstimate({
      task,
      work,
      pricing: { ...pricing, diagnosticsFee: 20, diagnosticsWaivedOnWork: false },
      urgency: 'this_week',
      location: 'city'
    });
    expect(e).toMatchObject({ from: 60, to: 80 });
  });

  it('requires phone beyond 20 km', () => {
    const e = calculateEstimate({ task, work, pricing, urgency: 'asap', location: 'beyond' });
    expect(e.requiresPhone).toBe(true);
    expect(e.notice).toContain('20 км');
  });

  it('rounds up', () => {
    const e = calculateEstimate({
      task,
      work: { ...work, priceFrom: 33.33, priceTo: 44.44 },
      pricing,
      urgency: 'asap',
      location: 'city'
    });
    expect(e).toMatchObject({ from: 40, to: 54 });
  });
});
