# ADR-002: Lead delivery via Email (SMTP) + Viber, not an external database

- **Status:** Accepted
- **Date:** 2026-11-26

## Context

The legacy site wrote leads and reviews into an external notes database. The
rebuild needs a simple, dependable way for the owner to receive leads without an
external database or CMS.

## Decision

Deliver each lead through pluggable **`LeadNotifier`** channels:

- **Email** (Nodemailer/SMTP) — required channel; carries the full lead and
  compressed photo attachments.
- **Viber** (Bot API) — optional channel; sends a plain-text summary.
- **Test** (in-memory) — used when `LEAD_TEST_MODE=1` so tests run without
  credentials.

`notifyLead()` fans out to all configured notifiers and considers delivery
successful when at least one channel succeeds. Every lead is validated and
rate-limited server-side before delivery.

## Consequences

- No external-database dependency; leads arrive in the owner's inbox/chat.
- Photos are emailed (not stored on disk), so there is no persistent upload
  storage to maintain.
- Adding a CRM later means implementing one more `LeadNotifier`.
