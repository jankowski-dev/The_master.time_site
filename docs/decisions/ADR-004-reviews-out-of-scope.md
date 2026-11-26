# ADR-004: Reviews are out of scope

- **Status:** Accepted
- **Date:** 2026-11-26

## Context

An earlier design (`2026-09-07-reviews-design.md`) planned a customer-reviews
feature (review form, `/otzyvy` page, review API, schema/JSON-LD, home block,
navigation). During the rebuild the owner cancelled reviews.

## Decision

Remove reviews from the product scope entirely:

- No `/otzyvy` route, no review form/API, no review home block, no review nav
  links, no review JSON-LD/schema/events.
- The historical design doc is archived (moved to `docs/archive/`) and must not
  be reused.
- Marketing copy and structured data must not include fabricated ratings,
  testimonials, or review counts.

## Consequences

- Simpler scope and no moderation burden.
- The design-system and analytics vocabularies contain no review surfaces.
- If reviews are ever revisited, treat it as a fresh feature with its own ADR.
