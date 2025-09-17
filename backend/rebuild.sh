#!/bin/bash

echo "🔄 Rebuilding backend..."

# TypeScriptをコンパイル
echo "📦 Compiling TypeScript..."
npm run build

# データベースをリセットしてシード
echo "🗄️ Resetting database and seeding..."
npm run prisma:reset

echo "✅ Backend rebuild complete!"
echo "You can now start the server with 'npm run dev'"