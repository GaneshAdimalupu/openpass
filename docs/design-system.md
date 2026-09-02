# Design System

This is the source of truth for how makemyevent looks. If you're
building a UI — human or agent — pull values from here rather than
picking a color or size that "looks about right." The point isn't
to be restrictive, it's that a ticketing platform should feel
precise, and precision comes from everything tracing back to the
same small set of decisions.

Concept: a ticket stub. Paper, ink, a confirmation stamp, a
perforated tear line. Every token below traces back to that.

## Colors

| Token | Hex | Use |
|---|---|---|
| `paper` | `#F7F6F2` | Background |
| `ink` | `#1B1A18` | Primary text |
| `stamp` | `#1F7A4D` | Primary actions, confirmed states — used sparingly |
| `perforation` | `#DAD6CC` | Borders, dividers, the tear line |
| `alert` | `#C0432A` | Sold out, cancelled — genuinely urgent states only |

Only `stamp` is a "brand" color. Everything else is neutral. If a
screen has more than one or two `stamp`-colored things fighting for
attention, that's a sign something should be neutral instead.

CSS variables (drop into `apps/web/src/app/globals.css`):

```css
:root {
  --color-paper: #F7F6F2;
  --color-ink: #1B1A18;
  --color-stamp: #1F7A4D;
  --color-perforation: #DAD6CC;
  --color-alert: #C0432A;
}
```

Tailwind config:

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      paper: "#F7F6F2",
      ink: "#1B1A18",
      stamp: "#1F7A4D",
      perforation: "#DAD6CC",
      alert: "#C0432A",
    },
  },
}
```

Never hardcode these hex values directly in a component — use the
Tailwind class (`bg-paper`, `text-ink`, `bg-stamp`, etc.) so a
future palette change is a one-line edit, not a find-and-replace.

## Typography

Three fonts, each doing one job:

| Role | Font | Why |
|---|---|---|
| Display / headings | Archivo | Geometric, slightly official — reads like a printed form, not a soft startup sans |
| Body | IBM Plex Sans | Plain, technical, unfussy — everything readable |
| Ticket data | IBM Plex Mono | Only for actual ticket-like data: codes, dates, seat numbers |

Load via `next/font/google` in `apps/web/src/app/layout.tsx`:

```tsx
import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-display" });
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400","500"], variable: "--font-body" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono" });
```

### Scale

1.25 ratio, 16px base.

| Role | Size | Font / weight |
|---|---|---|
| H1 (event title) | 39px / 2.44rem | Archivo 600 |
| H2 (section) | 31px / 1.95rem | Archivo 600 |
| H3 (card title) | 25px / 1.56rem | Archivo 500 |
| Body | 16px / 1rem | Plex Sans 400 |
| Caption / label | 13px / 0.81rem | Plex Sans 500, uppercase, +0.04em tracking |
| Ticket data | 14px / 0.875rem | Plex Mono 500 |

Caption style (`ADMIT ONE`, `GATE`, `SEAT` register) — use for field
labels, not for general small text:

```css
.label {
  font-size: 0.81rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

## Layout

Content sits in a centered, max-width container — not full-bleed.
On wide screens you get quiet whitespace on both sides rather than
content stretching edge to edge.

```css
.container {
  max-width: 1280px;
  margin-inline: auto;
  padding-inline: 16px; /* mobile */
}
@media (min-width: 768px) {
  .container { padding-inline: 24px; }
}
@media (min-width: 1024px) {
  .container { padding-inline: 32px; }
}
```

Tailwind equivalent: `max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8`.

The header's background spans full width, but its inner content
(logo, nav, actions) sits inside the same container — so header
content lines up exactly with the page content below it.

This is for browsing/app pages (event listings, dashboards). A
future marketing/landing page is a different layout entirely and
doesn't need to follow this — don't force marketing hero sections
into the same centered column.

## Spacing

8px base grid. Only use these values — no arbitrary padding/margin
numbers:

```
4   8   16   24   32   48   64   96
```

## Signature element: the tear line

A dashed divider with small circular notches at each end, styled
like the perforation on a real ticket stub. Use it specifically to
separate an event's info from its action area (e.g. details above,
"Register" below) — it marks a real content boundary, not just a
place that needed a visual break.

```css
.tear-line {
  border-top: 1px dashed var(--color-perforation);
  position: relative;
}
.tear-line::before,
.tear-line::after {
  content: "";
  position: absolute;
  top: -6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-paper);
  border: 1px solid var(--color-perforation);
}
.tear-line::before { left: -6px; }
.tear-line::after { right: -6px; }
```

Use this element once per screen, where it's structurally true.
Don't scatter it as decoration.

## Writing

- Plain verbs, sentence case. No filler.
- Name things by what the user does, not how the system works — "Add ticket," not "Create ticket entity."
- A button's label and its confirmation message match: "Register" produces "Registered," not "Success."
- Errors say what happened and what to do next. No apologies, no vagueness.
- Empty states are an invitation, not a dead end — e.g. an organizer with no events yet sees "Host your first event," not "No events found."

## Imagery & Asset Dimensions

Standard aspect ratios and export dimensions for designers and organizers:

| Asset Type | Aspect Ratio | Recommended Size | Minimum Size | Formats |
|---|---|---|---|---|
| **Organization Banner / Poster** | `16:9` (or `2:1`) | `1200 × 675 px` (`1200 × 600 px`) | `600 × 338 px` | PNG, JPG, WebP (< 5MB) |
| **Event Cover / Poster** | `1:1` (Square) or `16:9` | `1200 × 1200 px` (or `1920 × 1080 px`) | `400 × 400 px` | PNG, JPG, WebP (< 5MB) |
| **User / Org Avatar** | `1:1` (Square) | `400 × 400 px` | `128 × 128 px` | PNG, JPG, WebP (< 2MB) |

- Safe Zone: Keep essential text and logos centered within the inner 80% to avoid cropping across responsive views.

## What not to do

- Don't introduce a new color without adding it here first.
- Absolutely NO raw hex colors (e.g. `bg-[#22c55e]`) or arbitrary palette values in UI components. Use ONLY the 5 official tokens: `paper`, `ink`, `stamp`, `perforation`, `alert`.
- Don't use `alert` (red) for anything that isn't genuinely urgent — it loses meaning if it's also used for regular warnings.
- Don't reach for the tear-line or perforated styling as generic decoration — it's reserved for real section boundaries.
- Don't mix in a fourth font "just for this one component."
- Don't use emojis in UI components or documentation — use Lucide icons (`lucide-react`) for visual indicators.
- Don't rely solely on `lg:` (1024px+) for 2-column or side-by-side card layouts — use `sm:` (640px+) or `md:` (768px+) so split-screen windows and tablets maintain full side-by-side structure.
