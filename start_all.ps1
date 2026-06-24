# AniCart Launcher Script
Clear-Host

Write-Host "====================================" -ForegroundColor Gray
Write-Host "AniCart v1.0.0" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Gray
Write-Host ""
Write-Host "Starting backend services..." -ForegroundColor Gray

# Start backend & worker in background
$backendJob = Start-Process cmd -ArgumentList "/c npm run dev:all" -WorkingDirectory "server" -WindowStyle Hidden -PassThru

# Polling health check loop
$success = $false
$mongo = "disconnected"
$redis = "disconnected"
$r2 = "disconnected"

for ($i = 0; $i -lt 45; $i++) {
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -TimeoutSec 2
        $mongo = $res.services.mongodb
        $redis = $res.services.redis
        $r2 = $res.services.r2
        if ($res.success -eq $true) {
            $success = $true
            break
        }
    } catch {
        # Continue trying
    }
    Start-Sleep -Seconds 1
}

if (-not $success -or $mongo -ne "connected") {
    Clear-Host
    Write-Host "====================================" -ForegroundColor Gray
    Write-Host "AniCart v1.0.0" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Gray
    Write-Host ""
    if ($mongo -ne "connected") {
         Write-Host "✗ MongoDB Connection Failed" -ForegroundColor Red
    }
    Write-Host "✗ Startup Failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Backend failed to respond. Check server logs."
    Write-Host "====================================" -ForegroundColor Gray
    
    # Clean up backend
    Stop-Process -Id $backendJob.Id -Force -ErrorAction SilentlyContinue
    Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Read-Host "Press Enter to exit..."
    exit 1
}

# Display clean success output
Clear-Host
Write-Host "====================================" -ForegroundColor Gray
Write-Host "AniCart v1.0.0" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Gray
Write-Host ""
Write-Host "✓ MongoDB Connected" -ForegroundColor Green

if ($redis -eq "connected") {
    Write-Host "✓ Redis Connected" -ForegroundColor Green
} elseif ($redis -eq "warning") {
    Write-Host "⚠ Redis Connected (Warning: Not Configured, Fallback Active)" -ForegroundColor Yellow
} else {
    Write-Host "⚠ Redis Connection Failed (Using Memory Fallback)" -ForegroundColor Yellow
}

if ($r2 -eq "connected") {
    Write-Host "✓ Cloudflare R2 Connected" -ForegroundColor Green
} elseif ($r2 -eq "warning") {
    Write-Host "⚠ Cloudflare R2 Connected (Warning: Missing Credentials, Fallback Active)" -ForegroundColor Yellow
} else {
    Write-Host "⚠ Cloudflare R2 Connection Failed" -ForegroundColor Yellow
}

Write-Host "✓ Backend Running" -ForegroundColor Green
Write-Host "✓ Frontend Starting" -ForegroundColor Green
Write-Host "✓ AniCart Ready" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:"
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:"
Write-Host "http://localhost:5000/api/v1" -ForegroundColor Cyan
Write-Host ""
Write-Host "===================================="

# Start frontend in background
$frontendJob = Start-Process cmd -ArgumentList "/c npm run start" -WorkingDirectory "client" -WindowStyle Hidden -PassThru

# Wait 3s then open browser
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Press Enter to stop all services and exit..."
Read-Host

Write-Host "Stopping services..."
Stop-Process -Id $backendJob.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontendJob.Id -Force -ErrorAction SilentlyContinue

# Kill TCP port processes
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Write-Host "Services stopped."
