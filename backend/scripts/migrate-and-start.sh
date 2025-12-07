#!/bin/bash
set -e

echo "Generating Prisma client..."
npm run prisma:generate

echo "Building TypeScript..."
npm run build

echo "Running database migrations..."
npx prisma migrate deploy || echo "Migrations failed, continuing..."

echo "Starting server..."
npm run start

