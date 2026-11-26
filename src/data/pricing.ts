import type { PricingConfigInput } from '../lib/content/schemas';

export const pricingData: PricingConfigInput = {
  currency: 'BYN',
  minOrder: 30,
  urgentSurchargePercent: 20,
  outOfTownFee: 20,
  outOfTownRadiusKm: 20,
  diagnosticsFee: 0,
  diagnosticsWaivedOnWork: true,
  disclaimer: 'Ориентировочно. Точную цену подтвержу после уточнения деталей.'
}; // demo values
