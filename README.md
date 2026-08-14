# openevents

Open-source, self-hostable event ticketing & management platform.

## Structure
- apps/web — Next.js web app
- apps/mobile — React Native (Expo) mobile app
- apps/api — NestJS public API (REST/OpenAPI)
- packages/db — Prisma schema + client
- packages/ui — shared React components
- packages/config — shared tsconfig/lint config

## Dev setup
1. `docker compose up -d` (starts Postgres)
2. `pnpm install`
3. `pnpm dev`
