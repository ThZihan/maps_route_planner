# Server Deployment Guide

This guide explains how to deploy and update the Maps Route Planner application on the Debian 13 headless server.

---

## ⚠️ IMPORTANT: Read Before Deploying

### Critical Lessons Learned

**Issue:** Switching between `docker-compose.yml` and `docker-compose.server.yml` caused data loss.

**Root Cause:**
1. Memory limits were too restrictive (512M for Nominatim)
2. Running `docker compose down` removed volumes
3. Different configurations caused initialization failures

**Solution:**
- **No memory limits** in server configuration (let containers use what they need)
- **Same volume names** in both configurations (preserves data)
- **Use `docker compose up -d`** without `--build` unless code changed
- **Never run `docker compose down`** unless intentionally resetting

---

## 📋 Table of Contents

1. [Branching Strategy](#branching-strategy)
2. [Initial Server Setup](#initial-server-setup)
3. [Safe Deployment Workflow](#safe-deployment-workflow)
4. [Update Workflow](#update-workflow)
5. [Troubleshooting](#troubleshooting)
6. [Configuration Reference](#configuration-reference)

---

## Branching Strategy

### Repository Structure

```
master (development)
    │
    └── server (production-ready)
```

### Branch Descriptions

| Branch | Purpose | Target Environment |
|--------|---------|-------------------|
| `master` | Development branch | Local development |
| `server` | Server-ready branch | Production server |

### Key Differences Between Configurations

| Aspect | docker-compose.yml | docker-compose.server.yml |
|--------|-------------------|--------------------------|
| Frontend Port | 80 | 3001 |
| Port Binding | 0.0.0.0 (all interfaces) | 127.0.0.1 (localhost only) |
| OSRM | Enabled (local) | Disabled (public API) |
| Memory Limits | None | None |
| Volume Names | Same | Same (important!) |

---

## Initial Server Setup

### Prerequisites

- Debian 13 headless server
- Docker Engine installed
- User with sudo privileges
- Git installed

### Step 1: Clone the Repository

```bash
# Navigate to project directory
cd ~/docker-projects

# Clone the server branch
git clone -b server https://github.com/ThZihan/maps_route_planner.git

# Navigate to project directory
cd maps_route_planner
```

### Step 2: Create Environment File

```bash
# Copy the server environment template
cp .env.server.example .env

# Edit the .env file with your actual values
nano .env
```

**Critical Settings to Update:**

```bash
# Change this to a strong, unique password
DB_PASSWORD=YourSecurePasswordHere123!

# Set to your Cloudflare domain in production
CORS_ORIGIN=https://maps.kalobiral.com.bd
```

### Step 3: Start the Application

```bash
# IMPORTANT: Use docker-compose.yml (the working configuration)
# Only use docker-compose.server.yml if you need different port bindings

docker compose up -d

# Verify containers are running
docker compose ps

# Check logs
docker compose logs -f
```

### Step 4: Verify Deployment

```bash
# Check if frontend is accessible
curl -I http://127.0.0.1:3001

# Check if backend is accessible
curl -I http://127.0.0.1:3000

# Check container status
docker compose ps
```

### Expected Output

```
NAME        IMAGE                           STATUS                  PORTS
backend     maps_route_planner-backend      Up (healthy)            127.0.0.1:3000->3000/tcp
frontend    nginx:alpine                    Up                      127.0.0.1:3001->80/tcp
nominatim   mediagis/nominatim:4.2          Up (healthy)            127.0.0.1:8081->8080/tcp
postgres    postgis/postgis:15-3.3-alpine   Up                      0.0.0.0:5432->5432/tcp
redis       redis:7-alpine                  Up                      0.0.0.0:6379->6379/tcp
```

---

## Safe Deployment Workflow

### ⚠️ CRITICAL: Safe Update Commands

**DO NOT USE:**
```bash
# ❌ DANGEROUS - Removes volumes and data
docker compose down

# ❌ DANGEROUS - May cause issues if no code changes
docker compose up -d --build
```

**SAFE TO USE:**
```bash
# ✅ SAFE - Just restarts containers
docker compose restart

# ✅ SAFE - Pulls new images if needed
docker compose pull

# ✅ SAFE - Starts containers without rebuild
docker compose up -d

# ✅ SAFE - Only rebuild if code changed
docker compose up -d --build
```

### Deployment Steps

1. **Pull latest changes**
   ```bash
   cd ~/docker-projects/maps_route_planner
   git pull origin server
   ```

2. **Check what changed**
   ```bash
   git log --oneline -5
   git diff HEAD~1 docker-compose.yml
   ```

3. **Apply updates safely**
   ```bash
   # If only code changed (frontend, backend)
   docker compose up -d --build
   
   # If only configuration changed
   docker compose up -d
   
   # If unsure, just restart
   docker compose restart
   ```

4. **Verify deployment**
   ```bash
   docker compose ps
   docker compose logs -f
   ```

---

## Update Workflow

### Development to Server Update Process

#### On Development Machine

1. **Make changes on master branch**
   ```bash
   git checkout master
   # Make your changes...
   ```

2. **Commit and push changes**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin master
   ```

3. **Merge to server branch**
   ```bash
   git checkout server
   git pull origin server  # Get latest server changes
   git merge master        # Merge master into server
   ```

4. **Resolve conflicts (if any)**
   ```bash
   # Review and resolve conflicts
   git status
   # Edit conflicting files...
   git add <resolved-files>
   git commit -m "Merge master into server"
   ```

5. **Push to remote**
   ```bash
   git push origin server
   ```

#### On Server

1. **Pull latest changes**
   ```bash
   cd ~/docker-projects/maps_route_planner
   git pull origin server
   ```

2. **Apply updates (choose one)**
   ```bash
   # Option A: Safe restart (recommended for most updates)
   docker compose restart
   
   # Option B: Rebuild if code changed
   docker compose up -d --build
   
   # Option C: Just ensure containers are running
   docker compose up -d
   ```

3. **Verify deployment**
   ```bash
   docker compose ps
   docker compose logs -f
   ```

### Configuration Protection

**Protected Files (via .gitignore):**
- `.env` - Your actual environment variables with secrets
- `.env.local` - Local overrides
- `.env.*.local` - Any local environment files

**Your `.env` file is protected and will NOT be overwritten by git pull!**

---

## Troubleshooting

### Container Won't Start

```bash
# Check container logs
docker compose logs <service-name>

# Check container status
docker compose ps -a

# Restart specific container
docker compose restart <service-name>
```

### Nominatim Issues

**Symptom:** Nominatim keeps restarting or shows unhealthy

**Solution:**
```bash
# Check logs
docker compose logs nominatim

# If database is corrupted, you may need to reinitialize
# WARNING: This will delete all geocoding data
docker compose stop nominatim
docker volume rm maps_route_planner_nominatim-data
docker volume rm maps_route_planner_nominatim-project
docker compose up -d nominatim

# Wait up to 1 hour for initialization
docker compose logs -f nominatim
```

### Port Already In Use

```bash
# Check what's using the port
ss -tlnp | grep <port>

# Stop conflicting service
docker compose stop <service-name>
```

### Memory Issues

```bash
# Check real-time memory usage
docker stats

# Check system memory
free -h

# If OOM occurs, check logs
dmesg | grep -i oom
```

### Git Merge Conflicts

```bash
# View conflicts
git status

# Edit conflicting files
nano <conflicted-file>

# Mark as resolved
git add <conflicted-file>

# Complete merge
git commit -m "Resolve merge conflicts"
```

### Configuration Changes Not Applied

```bash
# Verify .env file exists
ls -la .env

# Check if .env is being used
docker compose config

# Force recreation
docker compose up -d --force-recreate
```

---

## Configuration Reference

### docker-compose.server.yml

#### Port Bindings

| Service | External Port | Internal Port | Binding |
|---------|---------------|---------------|---------|
| Frontend | 3001 | 80 | 127.0.0.1 (localhost only) |
| Backend | 3000 | 3000 | 127.0.0.1 (localhost only) |
| Nominatim | 8081 | 8080 | 127.0.0.1 (localhost only) |
| PostgreSQL | 5432 | 5432 | 127.0.0.1 (localhost only) |
| Redis | 6379 | 6379 | 127.0.0.1 (localhost only) |

**Security Note:** All services bound to localhost only. Only accessible via Cloudflare Tunnel.

#### OSRM Configuration

**Default:** Using public API (https://router.project-osrm.org) to save ~768MB memory.

**To enable local OSRM:**
1. Uncomment the `osrm-backend` service in `docker-compose.server.yml`
2. Change `OSRM_URL` in backend environment to `http://osrm-backend:5000`
3. Rebuild containers: `docker compose up -d --build`
4. **Note:** This will use additional ~768MB memory

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Application environment |
| `BACKEND_PORT` | `3000` | Backend API port |
| `FRONTEND_PORT` | `3001` | Frontend port |
| `FRONTEND_URL` | `http://localhost:3001` | Frontend URL for CORS |
| `CORS_ORIGIN` | `*` | CORS allowed origins |
| `DB_PASSWORD` | Required | PostgreSQL password |
| `OSRM_URL` | `https://router.project-osrm.org` | OSRM routing API |
| `NOMINATIM_URL` | `http://nominatim:8080` | Nominatim geocoding URL |

---

## Quick Reference Commands

### Server Management

```bash
# Start containers
docker compose up -d

# Stop containers (WARNING: may remove volumes)
docker compose down

# Restart containers (SAFE)
docker compose restart

# View logs
docker compose logs -f

# Rebuild containers (only if code changed)
docker compose up -d --build

# Check container status
docker compose ps

# Check resource usage
docker stats
```

### Git Operations

```bash
# Pull latest changes
git pull origin server

# Check git status
git status

# View recent commits
git log --oneline -10

# Merge master into server
git merge master
```

### System Monitoring

```bash
# Check system memory
free -h

# Check disk space
df -h

# Check Docker disk usage
docker system df

# Clean up unused Docker resources
docker system prune -a
```

---

## Security Checklist

- [ ] `.env` file is NOT committed to git
- [ ] `DB_PASSWORD` is set to a strong, unique password
- [ ] All services bound to `127.0.0.1` (localhost only)
- [ ] Cloudflare Tunnel configured for HTTPS access
- [ ] Firewall rules configured (if applicable)
- [ ] Regular security updates applied to server

---

## Emergency Recovery

### If Site Goes Down

1. **Check container status**
   ```bash
   docker compose ps
   ```

2. **Check logs for errors**
   ```bash
   docker compose logs
   ```

3. **Try restarting**
   ```bash
   docker compose restart
   ```

4. **If restart fails, rebuild**
   ```bash
   docker compose up -d --build
   ```

5. **If still failing, check volumes**
   ```bash
   docker volume ls
   ```

6. **Last resort: Re-clone and restore**
   ```bash
   cd ~/docker-projects
   mv maps_route_planner maps_route_planner.backup
   git clone -b server https://github.com/ThZihan/maps_route_planner.git
   cd maps_route_planner
   cp ../maps_route_planner.backup/.env .
   docker compose up -d
   ```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2025-03-19 | Fixed memory limit issues, added safe deployment instructions |
| 1.0 | 2025-03-18 | Initial server deployment guide |
