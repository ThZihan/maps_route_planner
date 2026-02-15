@echo off
REM Maps Project Startup Script (Batch File)
REM This script starts all services and opens the application in your browser

echo ========================================
echo   Maps Route Project - Startup Script
echo ========================================
echo.

REM Check if Docker is running
echo Checking Docker status...
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and run this script again.
    pause
    exit /b 1
)
echo Docker is running.
echo.

REM Start Docker containers
echo Starting Docker containers...
docker-compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start Docker containers!
    pause
    exit /b 1
)
echo Docker containers started.
echo.

REM Wait for services
echo Waiting for services to be ready...
echo This may take a few minutes on first run...
timeout /t 30 /nobreak >nul

REM Fix nginx configuration
echo Configuring nginx...
docker exec frontend rm -f /etc/nginx/conf.d/default.conf 2>nul
docker exec frontend nginx -s reload 2>nul
echo Nginx configured.
echo.

REM Check service status
echo Service Status:
echo ----------------------------------------
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr "NAMES osrm nominatim backend frontend postgres redis"
echo.

REM Open browser
echo Opening application in browser...
start http://localhost

echo.
echo ========================================
echo   Application is ready!
echo ========================================
echo.
echo Access the application at: http://localhost
echo.
echo To stop the application, run:
echo   docker-compose down
echo.
echo To view logs, run:
echo   docker-compose logs -f
echo.
pause
