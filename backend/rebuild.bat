@echo off
echo 🔄 Rebuilding backend...

echo 📦 Compiling TypeScript...
call npm run build

echo 🗄️ Resetting database and seeding...
call npm run prisma:reset

echo ✅ Backend rebuild complete!
echo You can now start the server with 'npm run dev'
pause