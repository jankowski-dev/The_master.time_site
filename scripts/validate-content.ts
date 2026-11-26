import { loadContent, ContentValidationError } from '../src/lib/content';

try {
  const { categories, calculatorTasks } = loadContent();
  const workCount = categories.reduce((sum, category) => sum + category.works.length, 0);
  console.log(
    `Content OK: ${categories.length} categories, ${workCount} works, ${calculatorTasks.length} tasks.`
  );
} catch (error) {
  if (error instanceof ContentValidationError) {
    console.error('Content validation failed:');
    for (const issue of error.issues) {
      console.error(`  - ${issue}`);
    }
    process.exit(1);
  }
  throw error;
}
