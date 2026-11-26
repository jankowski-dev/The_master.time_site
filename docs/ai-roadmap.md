# AI roadmap (post-launch, not in phase 1)

The site is a static, content-driven Astro app. The following AI capabilities
are deliberately **out of scope for phase 1** and are listed here as a future
plan.

## RAG over content

- Export `src/data` (categories, works, FAQ, conditions, pricing) into a
  retrieval corpus.
- A `GET/POST /api/ask` route (Astro endpoint) would retrieve relevant snippets
  and return a grounded answer (phone/email/Viber stays the human channel).
- Guardrail: answers must cite content and refuse to invent prices, guarantees,
  or reviews. Always fall back to "I'll confirm by phone".

## Chat / photo / voice assistance

- **Chat**: a widget on `/kalkulyator` or `/zayavka` that answers questions
  about services and prices, then hands off to the lead form.
- **Photo**: accept a photo in the chat to pre-classify the job category
  (plumbing/electrical/…), then prefill the lead form.
- **Voice**: optional later; not required.

## Lead creation through the same API

- Any assistant's "submit a lead" action must call the existing pipeline — the
  same `POST /api/lead` shape or `handleLead()` — so validation, rate limiting,
  email/Viber delivery, and attribution stay consistent.

## Guardrails

- No invented facts, prices, guarantees, or reviews.
- No PII into analytics; respect consent.
- Human-in-the-loop for the final price confirmation (the brand promise is
  "I name the price before work starts").

## Cost / risk

- RAG and LLM calls add per-request cost and latency; keep the static site
  fast by making these opt-in and non-blocking.
- Reuse `LeadNotifier` to add a CRM webhook (`CRM_WEBHOOK_URL` is reserved but
  unwired) when a CRM is adopted.
