import type { CalculatorTask, PricingConfig, Work } from '@/lib/content/schemas';

export type Urgency = 'asap' | 'this_week' | 'flexible';
export type Location = 'city' | 'out_of_town' | 'beyond';

export interface EstimateLine {
  label: string;
  from: number;
  to?: number;
}

export interface Estimate {
  currency: 'BYN';
  from: number;
  to?: number;
  isRange: boolean;
  requiresPhone: boolean;
  minOrderApplied: boolean;
  duration?: string;
  lines: EstimateLine[];
  notice?: string;
  disclaimer: string;
}

export interface EstimateInput {
  task: CalculatorTask;
  work: Work;
  pricing: PricingConfig;
  urgency: Urgency;
  location: Location;
}
