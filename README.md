# OpenPass V2 🎟️

[![Turborepo](https://img.shields.io/badge/built%20with-Turborepo-ef4444.svg?style=flat-square&logo=turborepo)](https://turbo.build/)
[![Next.js](https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-orange?style=flat-square&logo=pnpm)](https://pnpm.io/)

OpenPass is a modern, high-performance event management and ticketing platform built with scalability and developer experience in mind. This monorepo houses the entire ecosystem, from the core business logic to the web application.

---

## ✨ Features

- **Monorepo Architecture**: Powered by Turborepo for lightning-fast builds and task execution.
- **Type-Safe**: 100% TypeScript across all apps and packages.
- **Modern UI**: Built with Next.js, Tailwind CSS, and a shared component library.
- **Robust Auth**: Integrated authentication via `@openpass/auth`.
- **Database Power**: Prisma ORM with PostgreSQL for reliable data management.
- **Developer-First**: Automated setup scripts and Docker-ready environment.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Monorepo Manager**: [Turborepo](https://turbo.build/)
- **Package Manager**: [pnpm](https://pnpm.io/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Component Library**: [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**: >= 18.x (Recommended: 20.x+)
- **pnpm**: >= 9.x
- **Docker**: For running the database locally.

### Installation & Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/GaneshAdimalupu/openpass.git
   cd openpass
   ```

2. **Run the bootstrap script**:
   This will install dependencies, create your `.env` file, and generate the Prisma client.

   ```bash
   pnpm bootstrap
   ```

3. **Configure Environment Variables**:
   Open the newly created `.env` file and update your credentials (e.g., Google OAuth).

4. **Start the Database**:

   ```bash
   pnpm docker:up
   ```

5. **Launch Development Server**:
   ```bash
   pnpm dev
   ```
   Navigate to `http://localhost:3002` for the web application.

---

## 📁 Project Structure

```text
.
├── apps/
│   └── web/          # Main Next.js application
├── packages/
│   ├── auth/         # Authentication logic & providers
│   ├── core/         # Shared business logic
│   ├── db/           # Prisma schema & database client
│   ├── ui/           # Shared React component library
│   └── types/        # Common TypeScript definitions
└── scripts/          # Automation and setup scripts
```

---

## 💾 Database Management

The project uses **Prisma** for database operations.

- **Generate Client**: `pnpm turbo run db:generate`
- **Push Schema**: `pnpm --filter @openpass/db prisma db push`
- **Studio**: `pnpm --filter @openpass/db prisma studio`

---

## 🐳 Docker

We use Docker Compose to manage local services (PostgreSQL).

- **Up**: `pnpm docker:up`
- **Down**: `pnpm docker:down`
- **Logs**: `pnpm docker:logs`

---

## 🤝 Contributing

We love contributions! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed instructions on:

- Branching conventions
- Commit message format (Conventional Commits)
- Quality gates (Linting, Formatting, Type-checking)

---

## 📄 License

This project is licensed under the terms specified in the [LICENSE](./LICENSE) file.

---

_Maintained by the OpenPass Core Team._
