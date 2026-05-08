# OpenPass Architecture Guide

## Introduction

OpenPass is built as a monorepo using Turborepo. This structure allows multiple applications and shared packages to live in a single repository, improving code reuse and development efficiency.

## Apps Directory

The `apps/` directory contains the main applications of the project.

### apps/web

This is the primary frontend application built with Next.js. It handles user interactions, UI rendering, and communicates with backend logic.

## Packages Directory

The `packages/` directory contains shared and modular code used across the project.

- **@openpass/core**  
  Contains the core business logic of the application.

- **@openpass/db**  
  Handles database interactions and data access.

- **@openpass/ui**  
  Provides reusable UI components used in the frontend.

- **@openpass/email**  
  Manages email-related functionality such as notifications.

These packages promote modularity and code reuse across the application.

## Data Flow

The application follows a structured data flow:

1. The Next.js frontend (apps/web) handles user interactions.
2. It calls functions from the `@openpass/core` package for business logic.
3. The core package interacts with the `@openpass/db` package to fetch or store data.
4. The response is returned back to the frontend and displayed to the user.

This layered approach ensures separation of concerns and maintainability.

## Contribution Guide

1. Clone the repository
2. Install dependencies using `pnpm install`
3. Run the development server
4. Make changes and create a pull request

## Additional Notes

- **Zod for Environment Variables**  
  The project uses Zod to validate environment variables, ensuring type safety and preventing runtime errors.

- **Docker Setup**  
  Docker is used to containerize the application, making it easier to run and deploy in consistent environments.
