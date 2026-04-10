# Contributing to OpenPass V2 🎟️

Thanks for your interest in contributing! OpenPass V2 is a modernized monorepo designed for high performance and scalability. We welcome contributors of all kinds.

---

## Architecture Overview

V2 uses a **Turborepo** monorepo structure:

- `apps/web`: The main Next.js web application.
- `apps/api`: Express-based API (refactored to consume shared core logic).
- `packages/core`: Shared business logic (Event rules, Registrations, etc.).
- `packages/db`: Database schema (Prisma) and client.
- `packages/ui`: Shared React components and design system.
- `packages/types`: Shared TypeScript definitions.

---

## Quick Start

### 1. Requirements

Ensure you have the following installed:

- **Node.js**: >= 20.x
- **pnpm**: >= 9.x (We use `pnpm` for workspace management)
- **PostgreSQL**: For database operations.

### 2. Fork & Clone

```bash
git clone https://github.com/GaneshAdimalupu/openpass.git
cd openpass
```

### 3. Setup

```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env

# Generate Prisma client
pnpm --filter @openpass/db generate
```

### 4. Development

```bash
# Run all apps and packages in parallel
pnpm dev
```

Navigate to `http://localhost:3000` for the web app.

---

## Development Workflow

### Branching

Follow these naming conventions for branches:

- `feat/xyz` → New features
- `fix/xyz` → Bug fixes
- `docs/xyz` → Documentation updates
- `chore/xyz` → Maintenance

### Quality Gates

We use automated tools to ensure code quality:

1. **Pre-commit Hooks**: Automatically formats code via `prettier` and checks staged files.
2. **Commit Messages**: We strictly follow [Conventional Commits](https://www.conventionalcommits.org/).
   - Format: `<type>(<scope>): <description>`
   - Example: `feat(web): add login page`
3. **Type Checking**: Run `pnpm check-types` across the repo.
4. **Linting**: Run `pnpm lint` across all packages.

---

## Code Style

- **TypeScript**: Mandatory for all logic.
- **Styling**: Tailwind CSS + `packages/ui`.
- **Formatting**: Handled by Prettier automatically on commit.

---

## Submitting a PR

1. Ensure your code passes `pnpm build`, `pnpm lint`, and `pnpm check-types`.
2. Push your branch and open a PR.
3. Use the PR template provided to describe your changes.
4. Once CI passes and you receive a review, your PR will be merged.

---

## Need Help?

Open an Issue or start a Discussion on GitHub. We're happy to help! 🙌
