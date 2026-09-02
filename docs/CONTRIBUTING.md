# Contributing

Thanks for taking a look at makemyevent. Nothing here is set in stone
yet — the project is early, so if something in this doc is wrong or
missing, that's worth a PR too.

## Getting set up

Full walkthrough is in [`docs/setup.md`](docs/setup.md). Short version:

```
docker compose up -d
pnpm approve-builds
pnpm install
pnpm --filter web dev
```

## Before you open a PR

- Run `pnpm biome check --write .` — this is the same check the
  pre-commit hook runs, so it's better to catch it yourself than
  have CI catch it.
- Keep the PR scoped to one thing. A PR that fixes a typo and also
  refactors the auth flow is two PRs.
- If you're changing the database schema, explain what changed and
  why in the PR description — schema changes get read more carefully
  than most.

## Branches and commits

- Branch off `main`, one branch per change.
- Commit messages don't need to follow a strict format, but "fix
  bug" isn't useful to anyone six months from now — say what
  actually changed.

## Where things live

If you're not sure where a change belongs, [`docs/architecture.md`](docs/architecture.md)
has a rundown of the apps and packages. Quick pointers:

- Something in the browser UI → `apps/web`
- Something in the mobile app → `apps/mobile`
- API endpoints, business logic, database access → `apps/api`
- Database schema → `packages/db/prisma/schema.prisma`
- A component used by more than one app → `packages/ui`

## Picking something to work on

There's no curated "good first issue" list yet — the project's too
young. If you want to contribute before that exists, open an issue
describing what you'd like to work on first, so we don't end up with
two people doing the same thing.

## Questions

Open an issue. There's no Discord/Slack yet — if the project grows
enough to need one, it'll go here.
