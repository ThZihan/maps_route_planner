# Docker & Deployment Fixes - February 2026

## Summary of Issues Fixed

This document outlines all the Docker and deployment issues that were identified and fixed in the maps_testing project.

---

## Issues Identified and Fixed

### ✅ Issue 1: Port Configuration Mismatch
**Problem:**
- `.env` file had `PORT=3002`
- `docker-compose.yml` used `${BACKEND_PORT:-3000}` which defaulted to 3000
- This caused backend to be inaccessible on expected port

**Fix:**
- Updated `.env` to use `BACKEND_PORT=3000` to match docker-compose.yml
- Added comments explaining that docker-compose.yml overrides these values for Docker deployment

---

### ✅ Issue 2: OSRM/Nominatim URL Configuration Mismatch
**Problem:**
- `.env` file pointed to **public APIs**:
  - `OSRM_URL=https://router.project-osrm.org`
  - `NOMINATIM_URL=https://nominatim.openstreetmap.org`
- `docker-compose.yml` expected **local Docker services**:
  - `OSRM_URL=http://osrm-backend:5000`
  - `NOMINATIM_URL=http://nominatim:8080`
- Backend would fail to connect to services when using Docker

**Fix:**
- Updated `docker-compose.yml` with comments clarifying that local Docker services are used
- Added comments in `.env` explaining that these values are overridden by docker-compose.yml
- Created `docker-compose.dev.yml` that uses public APIs for quick testing

---

### ✅ Issue 3: Nominatim Health Check Blocking Backend
**Problem:**
- `docker-compose.yml` had backend depending on `nominatim` being **healthy**
- Nominatim takes **2-4 hours** to initialize on first run
- Backend would not start until Nominatim was fully ready

**Fix:**
- Changed backend dependency from `service_healthy` to `service_started` for nominatim
- Backend now starts as soon as Nominatim container is running (not necessarily ready)
- Backend service will handle Nominatim initialization gracefully with error handling

---

### ✅ Issue 4: Frontend Volume Mapping Issue
**Problem:**
- `docker-compose.prod.yml` expected `./frontend/dist` folder
- Project only had `./frontend` without `dist` folder
- Frontend container would fail to start in production mode

**Fix:**
- Updated `docker-compose.prod.yml` to use `./frontend` directly
- Added `:ro` (read-only) flag to both volume mounts for security
- Added comment explaining that `./frontend/dist` can be used if build is run

---

### ✅ Issue 5: Missing Simplified Development Configuration
**Problem:**
- No easy way to test the application without:
  - 7-10GB of disk space
  - 2-4 hours for Nominatim initialization
  - Downloading large OSRM data files

**Fix:**
- Created `docker-compose.dev.yml` that:
  - Uses public OSRM and Nominatim APIs (no local services needed)
  - Only requires ~500MB disk space
  - Starts in under 2 minutes
  - Perfect for development and testing

---

## Deployment Options

### Option 1: Quick Development (Recommended for Testing)
**Use when:** You want to test the application quickly without waiting hours

```bash
# Start with simplified dev configuration
docker-compose -f docker-compose.dev.yml up -d

# Check status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend
```

**Access:**
- Frontend: http://localhost
- Backend API: http://localhost:3000

**Disk Space Required:** ~500MB

---

### Option 2: Full Docker Deployment (Production-Ready)
**Use when:** You need full control and offline capability

**Prerequisites:**
1. **Free up disk space** on D: drive (need at least 7-10GB)
   - Delete unnecessary files (see `DEPLOYMENT_ISSUES.md`)
   - Or move project to C: drive if it has more space

2. **OSRM data is already prepared** (~300MB in `data/osrm/`)

```bash
# Start full Docker stack
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Check Nominatim initialization (this will take 2-4 hours)
docker logs -f nominatim
```

**Access:**
- Frontend: http://localhost
- Backend API: http://localhost:3000
- OSRM API: http://localhost:5000
- Nominatim: http://localhost:8080

**Disk Space Required:** 7-10GB

---

### Option 3: Production Deployment (VPS/Server)
**Use when:** Deploying to production server

```bash
# Use production configuration
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps
```

**Access:**
- Frontend: http://localhost:8081 (behind nginx reverse proxy)
- Backend API: http://localhost:3000

**Note:** Configure nginx reverse proxy on the server for domain access.

---

## Troubleshooting

### Containers Won't Start

**Check disk space:**
```bash
docker system df
```

**Check container logs:**
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs osrm-backend
```

**Check specific container:**
```bash
docker logs <container-name>
```

### Nominatim Still Initializing

If geocoding/search doesn't work:
```bash
# Check Nominatim logs
docker logs -f nominatim

# Look for "Nominatim is ready" message
```

While initializing, you can:
1. Use the dev configuration (`docker-compose.dev.yml`) which uses public APIs
2. Wait for Nominatim to finish (2-4 hours on first run)

### Backend Can't Connect to Services

**Check if services are running:**
```bash
docker-compose ps
```

**Check backend logs:**
```bash
docker-compose logs backend
```

**Test service connectivity from backend container:**
```bash
docker exec backend ping osrm-backend
docker exec backend ping nominatim
```

### Port Already in Use

If you get "port already in use" error:
```bash
# Find what's using the port
netstat -ano | findstr :3000

# Either stop the conflicting service or change the port in .env
```

---

## Files Modified

1. **`.env`** - Fixed port configuration
2. **`docker-compose.yml`** - Fixed Nominatim dependency and added comments
3. **`docker-compose.prod.yml`** - Fixed frontend volume mapping
4. **`docker-compose.dev.yml`** - NEW: Simplified development configuration

---

## Next Steps

1. **Choose deployment option** based on your needs and disk space
2. **Free up disk space** if using Option 2 (full deployment)
3. **Start containers** using appropriate docker-compose file
4. **Verify services** are running correctly
5. **Test the application** at http://localhost

---

## Additional Resources

- `DEPLOYMENT_ISSUES.md` - Disk space troubleshooting
- `plans/deployment-plan.md` - Full deployment documentation
- `DOCKER_TROUBLESHOOTING.md` - Docker-specific troubleshooting
- `DOCKER_INSTALLATION_WINDOWS.md` - Docker installation guide

---

## Quick Reference Commands

```bash
# Start dev environment (quick)
docker-compose -f docker-compose.dev.yml up -d

# Start full environment (requires disk space)
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Restart specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build backend
```
