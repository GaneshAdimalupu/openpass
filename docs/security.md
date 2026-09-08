# Auth & Security

This is the one doc in the repo where the rules aren't suggestions.
Everything else here (design system, code style) has room for taste.
This doesn't. If a PR touches auth, permissions, secrets, or user
data and doesn't follow this, it doesn't merge — flag it in review
rather than assuming it's fine because it works.

## Passwords

- Hash with bcrypt, cost factor 12 minimum (already the case in
  `registerUser`). Never lower this for "performance."
- Never log a password, hash included, at any log level, in any
  environment. Not even in a catch block "for debugging."
- Never send `passwordHash` back to the client, in any response,
  ever — not even on the user's own profile endpoint. Select only
  the fields the client actually needs, every time.
- Normalize email (lowercase, trim) before every lookup and every
  write. `Ganesh@x.com` and `ganesh@x.com` must resolve to the same
  account, not two.

## Sessions & JWT

- Session cookies: `httpOnly`, `secure` in production, `sameSite:
  lax` minimum. Never store a session token somewhere JS can read it
  (no `localStorage`).
- JWT payload (mobile) carries only `id` and `role` — never email,
  never password hash, never anything else from `User`. A JWT is
  decodable by anyone who has it; treat the payload as public.
- `NEXTAUTH_SECRET` (or equivalent signing secret) is different per
  environment (local/staging/prod) and never committed — it lives in
  `.env`, which is already gitignored. If it leaks, every session
  everywhere is compromised until it's rotated.
- Session/JWT expiry is finite. No infinite sessions "for
  convenience."

## Session revocation & self-healing

The `Session` table in PostgreSQL is used for device tracking and
remote session revocation (see `logoutDevice` / `logoutAllDevices`
in `apps/api/src/trpc/users.router.ts`). The JWT is the actual
auth mechanism; the `Session` row is a supplementary record.

- **Revocation works by deleting the `Session` row.** On the next
  request, the `jwt` callback sees the record is missing and
  invalidates the JWT by returning `null`.
- **Never recreate a deleted session unconditionally.** If a session
  record is missing, it could be because: (a) the initial write
  failed (transient DB error during OAuth callback), or (b) the
  user explicitly revoked it. Unconditional recreation defeats
  revocation -- this was a real vulnerability caught in review.
- **The `sessionRecordedAt` JWT flag** distinguishes the two cases.
  It is set only after a successful DB write. If the flag exists
  and the session is missing, the session was revoked -- honour it.
  If the flag is absent, the session was never created -- safe to
  heal. Read the inline comments in `apps/web/src/lib/auth.ts`
  before modifying this logic.
- **`return null` in NextAuth's `jwt` callback** destroys the
  user's session cookie. Never use it as a fallback for "I don't
  know what happened" -- it causes login loops if the trigger
  condition recurs on every request.

## OAuth provider safety

- `allowDangerousEmailAccountLinking` is enabled for Google and
  GitHub because both providers cryptographically verify email
  ownership before returning it. This allows users who first
  registered with credentials to link their OAuth accounts.
- Before adding a new OAuth provider with this flag, verify that
  the provider guarantees `email_verified: true`. Document the
  justification in a comment next to the flag in `auth.ts`.
- If a provider does NOT verify emails, do NOT enable
  `allowDangerousEmailAccountLinking` -- an attacker could create
  an account on that provider with someone else's email and
  hijack their account.

## Authorization — check on every request, not just at the UI layer

- The UI hiding a button is not access control. Every mutation
  (edit event, add volunteer, view guest list) re-checks on the
  server: is this user allowed to do this, specifically to this
  resource.
- Ownership checks are explicit and resource-scoped: "is this
  event's `organizerId` one this user owns" — not "is this user
  logged in." Being authenticated is not being authorized.
- `UserRole.ADMIN` is a platform-level role (moderation, support
  access) — it is not the same thing as owning an `Organizer`.
  Don't conflate the two when writing permission checks.

## Input validation

- Every tRPC procedure and every REST endpoint validates its input
  with a schema (Zod) before touching the database. No "the
  frontend already validates this" — the frontend is not a trust
  boundary, anyone can call the API directly.
- Never trust an ID from the client without checking it belongs to
  the resource being acted on (see Authorization above).

## Data exposure

- Public queries (`events.list`, anything unauthenticated) select
  only public-safe fields. Never `include` a full `User` or
  `Organizer` relation without checking what it drags in — an
  unguarded `include: { owner: true }` can leak email addresses to
  anyone browsing the public event list.
- Don't log full request/response bodies in production — they can
  contain tokens, emails, or form data that shouldn't sit in logs.

## Cross-origin & transport

- `apps/api`'s `app.enableCors()` is currently wide open (fine for
  local dev). Before any real deployment, this needs to be locked to
  known origins (the actual web/mobile app URLs) — an open CORS
  policy on an authenticated API is a real vulnerability, not a
  formality.
- Everything runs over HTTPS outside local dev. No exceptions.

## Database

- Prisma parameterizes queries by default — that's most of SQL
  injection protection for free. The one way to lose it: raw SQL
  (`$queryRawUnsafe` or string-interpolated `$queryRaw`). Don't use
  either with any client-influenced value. If raw SQL is ever
  genuinely needed, use tagged-template `$queryRaw` with
  parameters, never string concatenation.

## Dependencies

- Don't add a package without a real reason — every dependency is
  attack surface. Check it's maintained, not abandoned, before
  adding it.
- Security patches to existing dependencies aren't optional
  "whenever" updates — treat a known CVE in something we depend on
  as a priority fix, not backlog.

## File uploads (once these exist — banners, logos)

- Validate actual file content/MIME type server-side, never trust
  the client-reported extension or content-type header.
- Enforce a size limit before the file touches storage, not after.
- Never construct a storage path from unsanitized user input.

## If something looks like a real vulnerability

Don't open a public PR describing it in detail. Flag it privately
first (see `CONTRIBUTING.md` for contact) so it can be fixed before
it's public knowledge of how to exploit it.
