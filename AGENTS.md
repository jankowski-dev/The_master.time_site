# AGENTS.md

Guidance for AI agents working in this repository.

> Skeleton. Expanded in Task 16.

## Stack

- Astro 5 (static pages) with the Node adapter (`standalone`).
- TypeScript in strict mode.
- Node 22, npm.
- Vitest for unit tests, Playwright for end-to-end tests.
- ESLint (flat config) + Prettier.

## Commands

```bash
npm install
npm run dev
npm run check && npm run lint && npm run test && npm run build
npm run test:e2e
```

## Conventions

- API routes opt out of prerendering with `export const prerender = false`.
- The brand is **The Master Time**.
- Never commit `.env` or secrets; use `.env.example` placeholders.
