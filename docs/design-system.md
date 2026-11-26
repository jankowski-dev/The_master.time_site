# Design system

## Tokens

Defined in `src/styles/tokens.css` on `:root`. Prefer tokens over raw values.

### Color

| Token                  | Value     | Use                                  |
| ---------------------- | --------- | ------------------------------------ |
| `--color-accent`       | `#c7452c` | Primary CTAs, links, highlights      |
| `--color-accent-strong`| `#a83a24` | Hover/active, emphasized price text  |
| `--color-accent-soft`  | `#f9ece7` | Tinted backgrounds                   |
| `--color-ink`          | `#161312` | Dark sections, header/footer         |
| `--color-ink-soft`     | `rgba(...)` | Soft dark                           |
| `--color-text`         | `#2b2523` | Body text                            |
| `--color-muted`        | `#606060` | Secondary text                       |
| `--color-line`         | `#e7e1dd` | Borders                              |
| `--color-surface`      | `#ffffff` | Cards/surface                        |
| `--color-surface-alt`  | `#f6f6f6` | Alternate surface                    |
| `--color-success` / `--color-error` / `--color-warning` | | Status |

The accent was darkened (from `#ea6249`) in Task 16 to meet WCAG AA: white text
on `--color-accent` is now ≥ 4.5:1. Decorative radial gradients over dark
sections use a fixed `rgba(199, 69, 44, …)` tint.

### Radii, elevation, motion

- Radii: `--radius-sm` 8px · `--radius-md` 12px · `--radius-lg` 20px ·
  `--radius-xl` 28px · `--radius-pill` 999px.
- Elevation: `--shadow-sm` / `--shadow-md` / `--shadow-lg`.
- Motion: `--transition: 180ms ease`; `prefers-reduced-motion` is honored in
  `global.css`.

## Typography

- Family: Montserrat (`--font-sans`), self-hosted via `@fontsource` (weights
  300/400/500/700/900).
- Base: 16px / 1.5.
- Headings use `clamp()` for fluid scaling; `h1`–`h6` set `font-weight: 700`
  and `overflow-wrap: break-word`.

## Spacing & layout

- Container: `--container: 1200px`, gutter `--gutter: 20px`.
- Section vertical padding: `--section-y: 64px`.
- Utility classes in `utilities.css`: `.grid-2`, `.grid-3`, `.stack`,
  `.cluster`, `.flow`.
- Mobile sticky CTA reserves `--sticky-cta-height: 72px`; the consent banner
  stacks above it on small screens.

## Components

- **Button** (`ui/Button.astro`) — variants `primary` / `secondary` / `ghost` /
  `dark`, sizes `md` / `lg`; renders `<a>` or `<button>`.
- **Field / PhoneField / Checkbox / ConsentField** — form controls with labels,
  hints, errors, `aria-invalid`, `role="alert"`.
- **Icon** (`ui/Icon.astro`) — inlines an SVG from `src/assets/icons` by name;
  decorative by default (`aria-hidden`), or `role="img"` with `aria-label` when
  a `title` is passed.
- **Accordion** (`ui/Accordion.astro`) — native `<details>/<summary>` FAQ items
  carrying `data-faq-item`.
- **LeadForm / LeadFormDialog** — the lead form and its modal `<dialog>`.
- **Analytics / ConsentBanner** — consent-gated tracking.
- **Seo / JsonLd** — meta tags and structured data.

## Responsive

Mobile-first with `min-width` breakpoints at 640px, 768px, 1024px. The header
collapses to a hamburger (`data-menu-toggle`) under 768px; the sticky CTA is
mobile-only. E2E asserts no horizontal overflow at 375/768/1280px.

## Accessibility

- Skip link (`skip-link`) to `#main`.
- Semantic landmarks (`header`, `nav`, `main`, `footer`).
- `:focus-visible` outline in the accent color.
- Native `<details>` for the FAQ and services dropdown.
- `<dialog>` for the lead modal with focus return and `aria-labelledby`.
- `lang="ru"`, viewport meta, `theme-color`.
- Color contrast meets WCAG AA (axe-checked in `tests/e2e/a11y.spec.ts`).
- `prefers-reduced-motion` support.
