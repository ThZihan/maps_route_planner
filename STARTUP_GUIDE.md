# Maps Project - Quick Start Guide

## One-Click Startup

You can start the entire project with a single command or double-click:

### Option 1: PowerShell Script (Recommended)
Run this command in PowerShell:
```powershell
.\start-project.ps1
```

### Option 2: Batch File (Easiest)
Simply double-click the file:
```
start.bat
```

## What the Startup Script Does

1. ✅ Checks if Docker is running
2. ✅ Starts all Docker containers (OSRM, Nominatim, Backend, Frontend, PostgreSQL, Redis)
3. ✅ Waits for services to be ready
4. ✅ Fixes nginx configuration (removes default.conf)
5. ✅ Reloads nginx
6. ✅ Opens the application in your browser at http://localhost

## Access the Application

Once the script completes, open your browser and go to:
```
http://localhost
```

## Stop the Application

To stop all services, run:
```bash
docker-compose down
```

## View Logs

To view real-time logs from all services:
```bash
docker-compose logs -f
```

To view logs from a specific service:
```bash
docker logs backend
docker logs frontend
docker logs osrm-backend
docker logs nominatim
```

## Troubleshooting

### Docker is not running
- Start Docker Desktop
- Wait for Docker to be fully initialized
- Run the startup script again

### Frontend shows default nginx page
- The startup script automatically fixes this
- If it persists, run: `docker exec frontend rm -f /etc/nginx/conf.d/default.conf && docker exec frontend nginx -s reload`

### Services not responding
- Check if all containers are running: `docker ps`
- Restart containers: `docker-compose restart`
- View logs for errors: `docker-compose logs`

### Port already in use
- Stop other applications using ports 80, 3000, 5000, 8080, 5432, 6379
- Or modify the ports in `.env` file

## First Run

On the first run, Nominatim (geocoding service) may take 15-30 minutes to initialize. The application will still work for route calculation, but location search may be unavailable until Nominatim is fully ready.

## Services Overview

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 80 | Web application (nginx) |
| Backend | 3000 | API server (Node.js/Express) |
| OSRM | 5000 | Routing engine |
| Nominatim | 8080 | Geocoding service |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |

## Testing the Animation

1. Open http://localhost in your browser
2. Click on the map to set a start location (green marker)
3. Click on another location to set an end location (red marker)
4. Click "Calculate Route" button
5. Click "▶ Play" button to start the animation
6. Watch the vehicle move along the route with flowing water effects!
