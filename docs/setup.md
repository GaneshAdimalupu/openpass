# Setup

## You'll need

- Node.js (recent LTS)
- [pnpm](https://pnpm.io) — `npm install -g pnpm`
- Docker, for local Postgres

## Steps

Clone the repo, then from the root:

```
pnpm install
```

Start Postgres:

```
docker compose up -d
```

This runs on host port `5433`, not the default `5432` — if you
already have a local Postgres running, this avoids clashing with it.

pnpm will refuse to run some native build scripts (Prisma's engines,
mainly) until you approve them once:

```
pnpm approve-builds
```

Select all three packages when it asks, confirm, and it'll build them.

Set up your env files. Copy the examples and they should work as-is
against the Docker Postgres above:

```
cp packages/db/.env.example packages/db/.env
cp apps/api/.env.example apps/api/.env
```

Check Prisma can see everything:

```
cd packages/db && npx prisma validate
```

Run the web app:

```
pnpm --filter web dev
```

It should be up at `localhost:3000`.

## If something breaks

**`--workspace-root may only be used inside a workspace`**
This shouldn't happen if you're installing normally, but if you're
regenerating parts of the workspace by hand, `pnpm-workspace.yaml`
has to exist before you run `pnpm add -w`, not after.

**Postgres container won't start — "port is already allocated"**
Something else on your machine is using `5432`. Either stop it, or
change the port mapping in `docker-compose.yml`.

**Prisma error: "Cannot find module 'dotenv/config'"**
`prisma.config.ts` needs `dotenv` installed in `packages/db`:
`pnpm add -D dotenv` from that folder.

**Prisma 7 scripts (seed, standalone scripts) can't find `DATABASE_URL` or fail to connect**
Prisma 7 doesn't implicitly read a connection URL the way earlier versions did outside of `prisma.config.ts`. In any standalone script (like the seed script) you need:
- `import "dotenv/config"` at the top, so `process.env.DATABASE_URL` is populated
- A driver adapter — install `@prisma/adapter-pg` and pass it to `PrismaClient` instead of relying on an implicit connection
- Import the generated client from the explicit path, e.g. `../generated/prisma/client.ts` — Prisma 7's generated output doesn't have an `index.js` barrel file the way older versions did

**`unmet peer react` warning during install**
Expo pins a slightly different React patch version than Next.js
does. Harmless in a pnpm workspace where each app has its own copy —
not something to fix by hand.

## Running the whole thing

Right now only `apps/web` has something worth running — `apps/api`
and `apps/mobile` are empty scaffolds. Once there's real code in
them:

```
pnpm --filter api dev
pnpm --filter mobile start
```
