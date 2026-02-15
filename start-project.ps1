# Maps Project Startup Script
# This script starts all services and opens the application in your browser

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Maps Route Project - Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    $dockerStatus = docker ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
        Write-Host "Please start Docker Desktop and run this script again." -ForegroundColor Red
        exit 1
    }
    Write-Host "Docker is running." -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not installed or not running!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Start Docker containers
Write-Host "Starting Docker containers..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start Docker containers!" -ForegroundColor Red
    exit 1
}
Write-Host "Docker containers started." -ForegroundColor Green
Write-Host ""

# Wait for backend to be ready
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Gray
$timeout = 120  # 2 minutes timeout
$elapsed = 0
while ($elapsed -lt $timeout) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "Backend is ready!" -ForegroundColor Green
            break
        }
    } catch {
        # Backend not ready yet
    }
    Start-Sleep -Seconds 2
    $elapsed += 2
    Write-Host "." -NoNewline -ForegroundColor Gray
}

if ($elapsed -ge $timeout) {
    Write-Host ""
    Write-Host "WARNING: Backend did not respond within timeout period." -ForegroundColor Yellow
    Write-Host "Continuing anyway..." -ForegroundColor Yellow
}
Write-Host ""

# Fix nginx configuration (remove default.conf)
Write-Host "Configuring nginx..." -ForegroundColor Yellow
try {
    docker exec frontend rm -f /etc/nginx/conf.d/default.conf 2>$null
    docker exec frontend nginx -s reload 2>$null
    Write-Host "Nginx configured successfully." -ForegroundColor Green
} catch {
    Write-Host "WARNING: Failed to configure nginx. The app may still work." -ForegroundColor Yellow
}
Write-Host ""

# Check service status
Write-Host "Service Status:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String -Pattern "NAMES|osrm|nominatim|backend|frontend|postgres|redis"
Write-Host ""

# Open browser
Write-Host "Opening application in browser..." -ForegroundColor Yellow
Start-Process "http://localhost"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Application is ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application at: http://localhost" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop the application, run:" -ForegroundColor Gray
Write-Host "  docker-compose down" -ForegroundColor White
Write-Host ""
Write-Host "To view logs, run:" -ForegroundColor Gray
Write-Host "  docker-compose logs -f" -ForegroundColor White
Write-Host ""
