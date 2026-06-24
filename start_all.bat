@echo off
echo Starting backend...
start cmd /k "cd server && npm run dev:all"
timeout /t 8 >nul
echo Backend ready.
echo Starting frontend...
start cmd /k "cd client && npm start"
echo AniCart running.
