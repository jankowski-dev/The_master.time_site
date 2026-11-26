import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      '.astro/',
      'test-results/',
      'playwright-report/',
      // Legacy Express site: removed in Task 16.
      'js/',
      'server.js'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly'
      }
    }
  },
  prettier
];
