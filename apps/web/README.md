# OpenPass Web Application 🌐

This is the primary web application for the OpenPass ecosystem, built with **Next.js 16** and **Turbopack**.

## 🚀 Overview

The web app provides the user interface for event discovery, ticket purchasing, and organizer dashboards. It is designed to be fast, responsive, and aesthetically premium.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Components**: Shared `@openpass/ui` library
- **Authentication**: Better Auth (integrated via `@openpass/auth`)
- **Animations**: Framer Motion
- **Maps**: Leaflet (for event locations)

## 🔧 Local Development

From the root of the monorepo, you can run the web app specifically:

```bash
pnpm dev --filter=@openpass/web
```

The app will be available at `http://localhost:3002`.

## 📁 Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: App-specific components (non-shared).
- `src/`: Utilities and client-side logic.
- `public/`: Static assets.

## 🎨 Design System

This application follows the "Electric Open" design system defined in `@openpass/ui`, utilizing a custom dark-mode palette and rich micro-animations.
