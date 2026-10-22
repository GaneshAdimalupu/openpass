# Agent & contributor instructions

Rules for anyone writing code here — a human contributor or an AI
agent. Read `docs/architecture.md` and `docs/design-system.md`
before making UI or schema changes; read `docs/security.md` before
touching auth, permissions, secrets, or user data — this file
assumes you already know what's in those.

## Before you write code

- Know which app/package the change belongs in (see
  `docs/architecture.md` §2). Don't put API logic in `apps/web`, and
  don't put UI in `apps/api`.
- If the change touches the database, the schema change is its own
  reviewable step — don't bundle a migration into an unrelated PR.
- If you're about to add a dependency, check if `packages/*` already
  has something that does the job first.

## Code style

- TypeScript strict mode, everywhere. No `any` — if the type is
  genuinely unknown, use `unknown` and narrow it.
- Biome is the formatter and linter. Run `pnpm biome check --write .`
  before committing — the pre-commit hook runs it anyway, so this
  just saves you a failed commit.
- Exported functions and component props get explicit types. Don't
  rely on inference for anything another file imports.
- No default exports for components — named exports only, so
  renames and refactors don't silently break imports.

## Layout, spacing, color

All of this is defined in `docs/design-system.md` — this section is
just the enforcement rule:

- Spacing values come from the 8px scale (`4 8 16 24 32 48 64 96`)
  only. No arbitrary Tailwind values like `p-[13px]`.
- Colors come strictly from the 5 design system Tailwind tokens (`bg-paper`, `text-ink`, `bg-stamp`, `border-perforation`, `text-alert`). Absolutely NO raw hex values (e.g. `bg-[#22c55e]`), HSL/RGB values, or non-token Tailwind colors are permitted in components under any circumstances.
- Responsive Grid Layouts: Always use `sm:` (640px+) or `md:` (768px+) for multi-column grids and side-by-side card layouts so that split-screen windows, iPads, and tablets render side-by-side gracefully without forcing single-column mobile drop.
- Fonts are the three defined in the design system. Don't add a
  fourth "just for this component."
- If a layout needs a value the design system doesn't have (a new
  color, a spacing value off the grid), that's a design-system PR
  first, not a one-off exception in your component.

## Components

- Next.js App Router: Server Components by default. Only add
  `"use client"` when the component actually needs interactivity,
  state, or a browser API — not defensively.
- Anything used by more than one app goes in `packages/ui`, not
  copy-pasted between `apps/web` and `apps/mobile`.
- Keep components small enough that their file is mostly the thing
  they render, not branching logic — pull data-fetching and business
  logic out into hooks or the API layer.

## Testing

- Vitest for unit tests, colocated with the code (`thing.ts` +
  `thing.test.ts`), not in a separate `__tests__` tree.
- Playwright for end-to-end coverage of the flows that actually
  matter if they break: registering for an event, hosting an event,
  check-in scanning.
- Any PR that changes logic (not just styling/copy) needs a test
  covering the change. If you're not sure how to test something,
  say so in the PR rather than skipping it silently.
- Don't write a test that just asserts the implementation does what
  the implementation does — test behavior, not internals.

## API

- Internal calls from `apps/web` go through tRPC. Anything
  cross-boundary (mobile, third-party, future public API) goes
  through the REST/OpenAPI layer in `apps/api`. Don't add a
  one-off REST endpoint for something `apps/web` could reach over
  tRPC.
- `apps/api` is the only thing that talks to the database. Nothing
  in `apps/web` or `apps/mobile` imports `packages/db` directly.

## Security-critical code

Read `docs/security.md` in full before touching anything in this list.
These rules are not suggestions.

- **Auth changes require a security review.** Any PR that modifies
  `apps/web/src/lib/auth.ts`, NextAuth callbacks, session handling,
  or OAuth provider configuration must be reviewed against
  `docs/security.md` before merge. "It fixes the bug" is not
  sufficient — it must fix the bug without weakening security.
- **Never bypass session revocation.** The `Session` table supports
  remote device revocation (`logoutDevice`, `logoutAllDevices` in
  `users.router.ts`). Any "self-healing" or retry logic for missing
  session records must distinguish "never created" from "explicitly
  revoked." The `sessionRecordedAt` JWT flag exists for this —
  read its comments in `auth.ts` before changing session logic.
- **Select only what you need.** Every `prisma.*.findUnique` /
  `findFirst` / `findMany` must use an explicit `select` with only
  the fields the calling code actually reads. Never select `email`,
  `passwordHash`, or relations you don't use. This is enforced in
  `docs/security.md` § Data exposure.
- **OAuth `allowDangerousEmailAccountLinking`** is enabled because
  both Google and GitHub verify email ownership. If adding a new
  OAuth provider, verify it also guarantees email verification
  before enabling this flag — document the justification in a
  comment next to the flag.

## File & naming conventions

- Files: `kebab-case.ts`. Components: `PascalCase` for the export,
  file name still kebab-case (`event-card.tsx` exporting
  `EventCard`).
- One component per file, matching the export name.
- Types/interfaces live next to what uses them unless they're
  shared across apps, in which case they belong in `packages/db`
  (if they're derived from the schema) or a shared types package.

## Accessibility

- Every interactive element is reachable and operable by keyboard.
- Images need real `alt` text — describe what's in the image, not
  "image" or the filename.
- Don't convey state with color alone (e.g. "sold out" needs the
  word, not just red text).

## What not to do

- Don't invent new conventions this file doesn't cover — flag it in
  the PR and we add it here, so the next person doesn't have to
  guess too.
- Don't refactor unrelated code while doing something else. Separate
  PR.
- Do not silently change the design system, the schema, or the API
  contract as a side effect of an unrelated fix.
- Do not use the `browser_subagent` for purely capturing screenshots of complex React state or multi-step modal workflows (it is prone to infinite loops and timeouts). Verify UI changes manually or ask the user to verify.
- Do not use emojis in UI components, documentation, or code. Use clean SVG icons or Lucide icons (`lucide-react`) per `docs/design-system.md`.
- Do not `return null` from NextAuth's `jwt` callback without
  understanding the consequences — it destroys the user's session
  cookie and can cause login loops if the trigger condition recurs.
- Do not recreate deleted `Session` records unconditionally. Deleted
  sessions may be intentional revocations. Always check the
  `sessionRecordedAt` token flag first.
- Do not catch and silently swallow errors in auth callbacks without
  logging them. Use `console.error` with a descriptive prefix so
  issues are traceable in production logs.
