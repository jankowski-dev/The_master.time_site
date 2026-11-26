# ADR-001: Astro static site + Node adapter

- **Status:** Accepted
- **Date:** 2026-11-26

## Context

The previous site was a fixed-size, two-stage, server-rendered app backed by an
external notes database. The rebuild needs to be fast, SEO-friendly, cheap to
host, and maintainable by non-experts, while still needing a few server routes
(lead delivery, Viber webhook, health).

## Decision

Use **Astro 5** with static output and the **Node adapter in `standalone`
mode**:

- Content pages are prerendered to static HTML.
- API routes (`/api/lead`, `/api/health`, `/api/viber/webhook`) and the 404 page
  opt out of prerendering (`export const prerender = false`).
- Content is typed with Zod and validated at build time.

## Consequences

- Fast static pages with a thin server for the few dynamic routes.
- Content changes require a rebuild (acceptable for this site).
- One Node process to deploy; no database.
