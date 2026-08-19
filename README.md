<div align="center">
  <img src="apps/web/public/openpass.svg" alt="openevents Logo" width="280" />
  <br />
  <br />
  <a href="https://turbo.build/">
    <img src="https://img.shields.io/badge/built%20with-Turborepo-ef4444.svg?style=flat-square&logo=turborepo" alt="Turborepo" />
  </a>
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js" alt="Next.js" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  </a>
  <a href="https://pnpm.io/">
    <img src="https://img.shields.io/badge/pnpm-orange?style=flat-square&logo=pnpm" alt="pnpm" />
  </a>
  <a href="https://openevents.vercel.app">
    <img src="https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat-square&logo=vercel" alt="Deployed on Vercel" />
  </a>
</div>

openevents is a modern, high-performance event management and ticketing platform built with scalability and developer experience in mind. This monorepo houses the entire ecosystem, from the core business logic to the web application.

**🟢 Live Deployment:** [https://openevents.vercel.app](https://openevents.vercel.app)

---

## 🌍 Our Mission

openevents isn't just a ticketing platform; it is built to be the bridge for the open-source and tech community. We believe that discovering, hosting, and attending tech events should be entirely frictionless.

Our goal is to build an ecosystem where:

- **🔍 Anyone can Discover:** Whether you are in a major tech hub or a small town, you can instantly see daily and upcoming open-source events happening around you.
- **🎟️ Seamless Registration & Entry:** Attendees can register with a single click and instantly receive dynamic, QR-coded digital passes delivered straight to their inboxes.
- **🎓 Beyond the Door:** The experience doesn't end when the event starts. openevents seamlessly handles post-event engagement, automating participation certificates and collecting valuable community feedback.

By eliminating the friction of event management, openevents empowers community leaders to focus on what actually matters: sharing knowledge, building connections, and writing great software.

---

## ✨ Features

- **Monorepo Architecture**: Powered by Turborepo for lightning-fast builds and task execution.
- **Type-Safe**: 100% TypeScript across all apps and packages.
- **Modern UI**: Built with Next.js, Tailwind CSS, and a shared component library.
- **Robust Auth**: Integrated authentication via `@openevents/auth`.
- **Database Power**: Prisma ORM with PostgreSQL (hosted on [Supabase](https://supabase.com)).
- **Developer-First**: Automated setup scripts and Docker-ready environment.

### 🚧 Current Development Status
- **Dashboard UI Phase 1**: Core dashboard framework matching FOSS United UI completed (RSVP, CFP, Schedule, Volunteers). Waitlisted for database integration.

---

## 🛠️ Tech Stack

| Layer            | Technology                                      |
| ---------------- | ----------------------------------------------- |
| Framework        | [Next.js](https://nextjs.org/)                  |
| Monorepo Manager | [Turborepo](https://turbo.build/)               |
| Package Manager  | [pnpm](https://pnpm.io/)                        |
| ORM              | [Prisma](https://www.prisma.io/)                |
| Database         | [Supabase](https://supabase.com/) (PostgreSQL)  |
| Styling          | [Tailwind CSS](https://tailwindcss.com/)        |
| Components       | [Lucide React](https://lucide.dev/)             |
| Animations       | [Framer Motion](https://www.framer.com/motion/) |
| Deployment       | [Vercel](https://vercel.com)                    |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**: >= 18.x (Recommended: 20.x+)
- **pnpm**: >= 9.x
- **Docker**: For running the database locally (optional if using hosted Supabase).

### Installation & Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/GaneshAdimalupu/openpass.git
   cd openpass
   ```

2. **Install Dependencies**:

   This will automatically install packages and create your local `.env` file from `.env.example`.

   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**:

   Open the `.env` file and update your credentials (e.g., Google OAuth, Supabase Connection strings).

4. **Start the Database (Local dev only)**:

   _Skip this step if you are connecting directly to your hosted Supabase instance._

   ```bash
   pnpm docker:up
   ```

5. **Sync Database Schema**:

   ```bash
   pnpm turbo run db:push
   ```

6. **Launch Development Server**:

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

The project uses **Prisma** for database operations and **Supabase** for PostgreSQL hosting in production.

| Command            | Script                                      |
| ------------------ | ------------------------------------------- |
| Generate Client    | `pnpm turbo run db:generate`                |
| Push Schema        | `pnpm --filter @openpass/db prisma db push` |
| Open Prisma Studio | `pnpm --filter @openpass/db prisma studio`  |

---

## 🐳 Docker

We use Docker Compose to manage local services (PostgreSQL). If you use a remote Supabase database, you can bypass this entirely.

| Command | Script             |
| ------- | ------------------ |
| Up      | `pnpm docker:up`   |
| Down    | `pnpm docker:down` |
| Logs    | `pnpm docker:logs` |

---

## 🤝 Contributing

We love contributions! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed instructions.

---

## 📄 License

This project is licensed under the terms specified in the [LICENSE](./LICENSE) file.