import { z } from 'zod';

export const WorkSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  priceFrom: z.number().int().nonnegative(),
  priceTo: z.number().int().nonnegative().optional(),
  unit: z.enum(['работа', 'час', 'м2', 'точка']).default('работа'),
  duration: z.string().min(1).optional(),
  description: z.string().optional(),
  includes: z.array(z.string()).default([]),
  notes: z.string().optional(),
  popular: z.boolean().default(false)
});

export const FaqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1)
});

export const SeoSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1)
});

export const CategorySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  icon: z.string().min(1),
  description: z.string().min(1),
  seo: SeoSchema,
  works: z.array(WorkSchema).min(1),
  faq: z.array(FaqItemSchema).default([])
});

export const CalculatorTaskSchema = z.object({
  id: z.string().min(1),
  categorySlug: z.string().min(1),
  label: z.string().min(1),
  workId: z.string().min(1),
  priceFrom: z.number().int().nonnegative().optional(),
  priceTo: z.number().int().nonnegative().optional(),
  duration: z.string().optional(),
  hint: z.string().optional()
});

export const PricingConfigSchema = z.object({
  currency: z.literal('BYN'),
  minOrder: z.number().int().nonnegative(),
  urgentSurchargePercent: z.number().int().nonnegative(),
  outOfTownFee: z.number().int().nonnegative(),
  outOfTownRadiusKm: z.number().int().nonnegative(),
  diagnosticsFee: z.number().int().nonnegative(),
  diagnosticsWaivedOnWork: z.boolean().default(true),
  disclaimer: z.string().min(1)
});

export const ConditionSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1)
});

export const SiteConfigSchema = z.object({
  brand: z.literal('The Master Time'),
  legalName: z.string().min(1),
  unp: z.string().min(1),
  phoneDisplay: z.string().min(1),
  phoneLink: z.string().regex(/^\+375\d{9}$/),
  email: z.email(),
  instagramUrl: z.url(),
  instagramDm: z.url(),
  viberUrl: z.string().min(1),
  areaServed: z.string().min(1),
  workingHours: z.string().min(1),
  copyright: z.string().min(1),
  defaultSeo: SeoSchema
});

export type Work = z.infer<typeof WorkSchema>;
export type FaqItem = z.infer<typeof FaqItemSchema>;
export type Seo = z.infer<typeof SeoSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type CalculatorTask = z.infer<typeof CalculatorTaskSchema>;
export type PricingConfig = z.infer<typeof PricingConfigSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type SiteConfig = z.infer<typeof SiteConfigSchema>;

export type WorkInput = z.input<typeof WorkSchema>;
export type FaqItemInput = z.input<typeof FaqItemSchema>;
export type SeoInput = z.input<typeof SeoSchema>;
export type CategoryInput = z.input<typeof CategorySchema>;
export type CalculatorTaskInput = z.input<typeof CalculatorTaskSchema>;
export type PricingConfigInput = z.input<typeof PricingConfigSchema>;
export type ConditionInput = z.input<typeof ConditionSchema>;
export type SiteConfigInput = z.input<typeof SiteConfigSchema>;
