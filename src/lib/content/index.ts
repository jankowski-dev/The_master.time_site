import { z } from 'zod';

import {
  CalculatorTaskSchema,
  CategorySchema,
  ConditionSchema,
  FaqItemSchema,
  PricingConfigSchema,
  SiteConfigSchema
} from './schemas';
import type {
  CalculatorTask,
  Category,
  Condition,
  FaqItem,
  PricingConfig,
  SiteConfig,
  Work
} from './schemas';

import { siteData } from '../../data/site';
import { categoriesData } from '../../data/categories';
import { calculatorTasksData } from '../../data/calculator';
import { pricingData } from '../../data/pricing';
import { faqsData } from '../../data/faq';
import { conditionsData } from '../../data/conditions';

export interface Content {
  site: SiteConfig;
  categories: Category[];
  calculatorTasks: CalculatorTask[];
  pricing: PricingConfig;
  faqs: FaqItem[];
  conditions: Condition[];
}

const ContentSchema = z.object({
  site: SiteConfigSchema,
  categories: z.array(CategorySchema),
  calculatorTasks: z.array(CalculatorTaskSchema),
  pricing: PricingConfigSchema,
  faqs: z.array(FaqItemSchema),
  conditions: z.array(ConditionSchema)
});

export class ContentValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(issues.length === 1 ? issues[0] : `${issues.length} content validation issue(s)`);
    this.name = 'ContentValidationError';
    this.issues = issues;
  }
}

function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}

function checkConstraints(content: Content): string[] {
  const issues: string[] = [];

  const seenSlugs = new Set<string>();
  for (const category of content.categories) {
    if (seenSlugs.has(category.slug)) {
      issues.push(`Duplicate category slug: ${category.slug}`);
    }
    seenSlugs.add(category.slug);
  }

  const seenWorkIds = new Set<string>();
  for (const category of content.categories) {
    for (const work of category.works) {
      if (seenWorkIds.has(work.id)) {
        issues.push(`Duplicate work id: ${work.id}`);
      }
      seenWorkIds.add(work.id);
    }
  }

  const seenTaskIds = new Set<string>();
  for (const task of content.calculatorTasks) {
    if (seenTaskIds.has(task.id)) {
      issues.push(`Duplicate calculator task id: ${task.id}`);
    }
    seenTaskIds.add(task.id);
  }

  const categoryBySlug = new Map(content.categories.map((c) => [c.slug, c]));
  for (const task of content.calculatorTasks) {
    const category = categoryBySlug.get(task.categorySlug);
    if (!category) {
      issues.push(`Calculator task ${task.id} references missing category: ${task.categorySlug}`);
      continue;
    }
    if (!category.works.some((w) => w.id === task.workId)) {
      issues.push(`Calculator task ${task.id} references missing work: ${task.workId}`);
    }
  }

  return issues;
}

export function parseContent(raw: unknown): Content {
  const result = ContentSchema.safeParse(raw);
  if (!result.success) {
    throw new ContentValidationError(formatZodIssues(result.error));
  }

  const content: Content = result.data;
  const issues = checkConstraints(content);
  if (issues.length > 0) {
    throw new ContentValidationError(issues);
  }

  return content;
}

export function loadContent(): Content {
  return parseContent({
    site: siteData,
    categories: categoriesData,
    calculatorTasks: calculatorTasksData,
    pricing: pricingData,
    faqs: faqsData,
    conditions: conditionsData
  });
}

export const content = loadContent();

export const site = content.site;
export const categories = content.categories;
export const calculatorTasks = content.calculatorTasks;
export const pricing = content.pricing;
export const faqs = content.faqs;
export const conditions = content.conditions;

export function getCategoryBySlug(slug: string): Category | undefined {
  return content.categories.find((category) => category.slug === slug);
}

export function getWorkById(category: Category, workId: string): Work | undefined {
  return category.works.find((work) => work.id === workId);
}

export function getCalculatorTasksByCategory(slug: string): CalculatorTask[] {
  return content.calculatorTasks.filter((task) => task.categorySlug === slug);
}

export interface PopularWork {
  category: Category;
  work: Work;
}

export function getPopularWorks(limit = 6): PopularWork[] {
  const all: PopularWork[] = content.categories.flatMap((category) =>
    category.works.map((work) => ({ category, work }))
  );
  const popular = all.filter(({ work }) => work.popular);
  const rest = all.filter(({ work }) => !work.popular);
  return [...popular, ...rest].slice(0, limit);
}
