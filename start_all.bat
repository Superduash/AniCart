@echo off
title AniCart Launcher
cls

powershell -NoProfile -ExecutionPolicy Bypass -Command "
Write-Host '====================================' -ForegroundColor Gray
Write-Host 'AniCart v1.0.0' -ForegroundColor Cyan
Write-Host '====================================' -ForegroundColor Gray
Write-Host 'Starting backend services...' -ForegroundColor Gray

# Start Backend & Worker in background
$backendJob = Start-Process cmd -ArgumentList '/c npm run dev:all' -WorkingDirectory 'server' -WindowStyle Hidden -PassThru

# Polling loop
$success = $false
$mongo = 'disconnected'
$redis = 'disconnected'
$r2 = 'disconnected'

for ($i = 0; $i -lt 45; $i++) {
    try {
        $res = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -Method Get -TimeoutSec 2
        $mongo = $res.services.mongodb
        $redis = $res.services.redis
        $r2 = $res.services.r2
        if ($res.success -eq $true) {
            $success = $true
            break
        }
    } catch {
        # Catch connection failures and keep trying
    }
    Start-Sleep -Seconds 1
}

Clear-Host
Write-Host '====================================' -ForegroundColor Gray
Write-Host 'AniCart v1.0.0' -ForegroundColor Cyan
Write-Host '====================================' -ForegroundColor Gray
Write-Host ''

if ($mongo -eq 'connected') {
    Write-Host '✓ MongoDB Connected' -ForegroundColor Green
} else {
    Write-Host '✗ MongoDB Connection Failed' -ForegroundColor Red
    Write-Host '✗ Startup Failed' -ForegroundColor Red
    Write-Host ''
    Write-Host 'Check server logs for details.'
    Read-Host 'Press Enter to exit...'
    exit 1
}

if ($redis -eq 'connected') {
    Write-Host '✓ Redis Connected' -ForegroundColor Green
} elseif ($redis -eq 'warning') {
    Write-Host '⚠ Redis Connected (Warning: Not Configured, Fallback Active)' -ForegroundColor Yellow
} else {
    Write-Host '⚠ Redis Connection Failed (Using Memory Fallback)' -ForegroundColor Yellow
}

if ($r2 -eq 'connected') {
    Write-Host '✓ Cloudflare R2 Connected' -ForegroundColor Green
} elseif ($r2 -eq 'warning') {
    Write-Host '⚠ Cloudflare R2 Connected (Warning: Missing Credentials, Fallback Active)' -ForegroundColor Yellow
} else {
    Write-Host '⚠ Cloudflare R2 Connection Failed' -ForegroundColor Yellow
}

Write-Host '✓ Backend Running' -ForegroundColor Green
Write-Host '✓ Frontend Starting' -ForegroundColor Green
Write-Host '✓ AniCart Ready' -ForegroundColor Green
Write-Host ''
Write-Host 'Frontend:'
Write-Host 'http://localhost:3000' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Backend:'
Write-Host 'http://localhost:5000/api/v1' -ForegroundColor Cyan
Write-Host ''
Write-Host '===================================='

# Launch Frontend in background
$frontendJob = Start-Process cmd -ArgumentList '/c npm run start' -WorkingDirectory 'client' -WindowStyle Hidden -PassThru

# Wait 3s then open browser
Start-Sleep -Seconds 3
Start-Process 'http://localhost:3000'

Write-Host 'Press Enter to stop all services and exit...'
Read-Host

Write-Host 'Stopping services...'
Stop-Process -Id $backendJob.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontendJob.Id -Force -ErrorAction SilentlyContinue

# Kill any node processes running on ports 5000 and 3000
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Write-Host 'Services stopped.'
"
