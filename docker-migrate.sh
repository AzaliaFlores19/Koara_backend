#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "Running database seed..."
  npx ts-node prisma/seed.ts
fi

echo "Migration complete."
