#!/bin/sh
set -e

echo "⏳  Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  echo "   ...not ready, retrying in 1s"
  sleep 1
done
echo "✅  PostgreSQL is up"

echo "🔄  Running Prisma migrations..."
npx prisma migrate deploy

npx tsx prisma/seed.ts

echo "🚀  Starting server..."
exec node dist/index.js