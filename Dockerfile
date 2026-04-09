# Stage 1: Prune the monorepo
FROM node:20-alpine AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app
RUN npm install -g turbo
COPY . .
# This slices out ONLY @openpass/web and its dependencies (@openpass/core, db, ui)
RUN turbo prune @openpass/web --docker

# Stage 2: Install dependencies
FROM node:20-alpine AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app
RUN npm install -g pnpm

COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# Stage 3: Build the project
COPY --from=builder /app/out/full/ .
# Generate prisma before building
RUN pnpm turbo run db:generate

ENV SKIP_ENV_VALIDATION=1

RUN pnpm turbo run build --filter=@openpass/web

# Stage 4: Run the app
FROM node:20-alpine AS runner
WORKDIR /app

# Only copy over the final Next.js build
COPY --from=installer /app/apps/web/next.config.js .
COPY --from=installer /app/apps/web/package.json .
COPY --from=installer /app/apps/web/.next/standalone ./
COPY --from=installer /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
