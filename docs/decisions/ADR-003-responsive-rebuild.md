# ADR-003: Responsive rebuild (no fixed-size stages)

- **Status:** Accepted
- **Date:** 2026-11-26

## Context

The legacy site rendered two fixed-size "stages" (a desktop canvas and a mobile
canvas) scaled to the viewport, with a splash screen. This was fragile, poor for
SEO/accessibility, and hard to maintain.

## Decision

Rebuild as a normal responsive, semantic site:

- Mobile-first CSS with `min-width` breakpoints and fluid `clamp()` type.
- Real navigation (header/footer), no stage scaling, no splash screen.
- Accessibility-first: skip link, landmarks, focus states, native `<details>`,
  `<dialog>` modal, WCAG AA contrast.

## Consequences

- One codebase for all viewports; simpler to edit and test.
- Better SEO and accessibility (axe-clean on core pages).
- Requires the content to be genuinely responsive rather than pixel-positioned.
