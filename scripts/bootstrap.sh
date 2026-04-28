#!/bin/bash

# OpenPass Bootstrap Script
# This script automates the initial environment setup for contributors.

set -e

echo "🚀 Starting OpenPass setup..."

# 1. Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first: https://pnpm.io/installation"
    exit 1
fi

# 2. Setup Environment Variables
if [ ! -f .env ]; then
    echo "📄 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env created. Please update it with your credentials (e.g., Google OAuth)."
else
    echo "ℹ️  .env already exists, skipping creation."
fi

# 3. Install Dependencies
echo "📦 Installing dependencies..."
pnpm install

# 4. Generate Prisma Client
echo "🛠️  Generating Prisma client..."
pnpm turbo run db:generate

echo ""
echo "✅ Setup complete!"
echo "------------------------------------------------"
echo "Next steps:"
echo "1. Ensure you have Docker running."
echo "2. Start the database: pnpm docker:up"
echo "3. Run the development server: pnpm dev"
echo "------------------------------------------------"
