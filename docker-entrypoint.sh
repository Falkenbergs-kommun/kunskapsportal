#!/bin/sh
set -e

echo "🚀 Starting Knowledge Base application..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until node -e "const { Client } = require('pg'); const client = new Client(process.env.DATABASE_URI); client.connect().then(() => { client.end(); process.exit(0); }).catch(() => process.exit(1));" 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Start the application
echo "🎯 Starting Next.js server..."
exec "$@"
