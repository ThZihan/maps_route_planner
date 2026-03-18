# Phase 8: Docker Installation & Map Project Deployment - Execution Guide

## Overview

This guide provides step-by-step instructions for manually executing the Docker installation and map project deployment on your Debian 13 headless server.

## Prerequisites

- **System**: Debian 13 (Trixie) - Headless Server
- **Hardware**: Intel Celeron N2840, 2048MB RAM
- **User**: zihan-server with sudo privileges
- **Free RAM**: ~1.6GB available

## Files Provided

1. **[`phase8-docker-installation-commands.sh`](phase8-docker-installation-commands.sh)** - Complete command script
2. **[`docker-compose-memory-limits-template.yml`](docker-compose-memory-limits-template.yml)** - Docker Compose template with memory limits

---

## Step-by-Step Execution

### Step 1: Install Docker Engine

Run these commands in your terminal:

```bash
# Update apt package index
sudo apt-get update

# Install ca-certificates and curl
sudo apt-get install ca-certificates curl -y

# Create Docker keyrings directory
sudo install -m 0755 -d /etc/apt/keyrings

# Add Docker's official GPG key
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc

# Set permissions on GPG key
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update apt package index again
sudo apt-get update

# Install Docker Engine packages
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

# Add zihan-server user to docker group
sudo usermod -aG docker zihan-server
```

**Expected Output**: Docker packages installed successfully, user added to docker group.

---

### Step 2: Apply Group Membership

```bash
# Apply new group membership
newgrp docker

# Verify Docker is running
docker --version
docker info
```

**Expected Output**: Docker version displayed, Docker service info shown.

---

### Step 3: Clone the Project Repository

```bash
# Create project directories
mkdir -p ~/web-projects
mkdir -p ~/docker-projects

# Clone the map project repository
cd ~/docker-projects
git clone https://github.com/ThZihan/maps_route_planner.git

# Navigate to project directory
cd ~/docker-projects/maps_route_planner

# List project files
ls -la
```

**Expected Output**: Repository cloned to `~/docker-projects/maps_route_planner`, files listed.

---

### Step 4: Analyze Project Configuration

```bash
# Check for docker-compose.yml
cat docker-compose.yml

# Check for Dockerfile
cat Dockerfile 2>/dev/null || echo "No Dockerfile found"

# Check for package.json
cat package.json 2>/dev/null || echo "No package.json found"
```

**IMPORTANT**: After running these commands, **report back the contents of [`docker-compose.yml`](docker-compose.yml)** so I can help you modify it with the correct memory limits.

---

### Step 5: Modify docker-compose.yml (After Analysis)

Based on your project's structure, modify [`docker-compose.yml`](docker-compose.yml) to add memory limits. Use [`docker-compose-memory-limits-template.yml`](docker-compose-memory-limits-template.yml) as reference.

**Key Modifications Required**:

1. **Frontend Service** (Node.js):
   - Add memory limit: `256M`
   - Port mapping: `"127.0.0.1:3000:3000"` (localhost only)
   - Add: `restart: unless-stopped`

2. **Backend Service** (Python):
   - Add memory limit: `512M`
   - Add: `restart: unless-stopped`

3. **OSRM Service** (Routing Engine):
   - Add memory limit: `1024M`
   - Add: `restart: unless-stopped`

**Example Structure**:
```yaml
services:
  frontend:
    deploy:
      resources:
        limits:
          memory: 256M
    ports:
      - "127.0.0.1:3000:3000"
    restart: unless-stopped

  backend:
    deploy:
      resources:
        limits:
          memory: 512M
    restart: unless-stopped

  osrm:
    deploy:
      resources:
        limits:
          memory: 1024M
    restart: unless-stopped
```

---

### Step 6: Build and Deploy Containers

```bash
# Navigate to project directory
cd ~/docker-projects/maps_route_planner

# Build the container images
docker compose build

# Start the containers
docker compose up -d

# Verify containers are running
docker compose ps

# Check container resource usage
docker stats
```

**Expected Output**: Containers built, started, and running. Memory usage within limits.

---

### Step 7: Verify Deployment

```bash
# Check if port 3000 is listening
netstat -tlnp | grep 3000

# Test local access
curl -I http://127.0.0.1:3000

# Check container logs
docker compose logs -f

# Verify memory limits are applied (replace <container_id> with actual ID)
docker inspect <container_id> | grep -A 10 Memory
```

**Expected Output**:
```
tcp  0  0 127.0.0.1:3000  0.0.0.0:*  LISTEN  12345/docker-proxy
HTTP/1.1 200 OK
```

---

### Step 8: Create Systemd Service (Optional - for Auto-Start)

```bash
# Create systemd service file
sudo tee /etc/systemd/system/map-app.service > /dev/null << 'EOF'
[Unit]
Description=Map Project Application
After=docker.service network.target
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/zihan-server/docker-projects/maps_route_planner
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
User=zihan-server
Group=zihan-server

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable --now map-app.service
sudo systemctl status map-app.service
```

**Expected Output**: Service created, enabled, and started.

---

## Memory Limits Summary

| Component | Memory Limit | Purpose |
|-----------|--------------|---------|
| Docker Engine | ~50-100MB | Base daemon overhead |
| Node.js Frontend | 256M | React/Vue/Angular frontend |
| Python Backend | 512M | API server |
| OSRM Routing Engine | 1024M | Open Source Routing Machine |
| **Total** | ~1.4GB | Within 2048MB limit |

---

## Troubleshooting Commands

### Docker Installation Issues

```bash
# Check Docker service status
sudo systemctl status docker

# Check Docker logs
sudo journalctl -u docker -f

# Apply new group membership
newgrp docker
```

### Container Build Issues

```bash
# Check build logs
docker compose build --no-cache

# Check disk space
df -h
```

### Container Runtime Issues

```bash
# Check container logs
docker compose logs

# Check running containers
docker ps -a

# Check container resource usage
docker stats

# Restart containers
docker compose restart
```

### Memory Issues

```bash
# Check system memory
free -h

# Check container memory limits
docker inspect <container_id> | grep -A 10 Memory
```

---

## Security Considerations

| Aspect | Configuration | Purpose |
|---------|---------------|---------|
| **Container Binding** | 127.0.0.1:3000 | Only accessible via Cloudflare Tunnel |
| **Memory Limits** | 1024M max | Prevent OOM on system |
| **Memory Swap** | Equal to memory | Prevent swap usage |
| **User Permissions** | zihan-server in docker group | Non-root container access |
| **Auto-Start** | systemd service | Automatic recovery |

---

## Next Steps

After successful deployment:

1. **Configure Cloudflare Tunnel** to expose port 3000 securely
2. **Test the application** through the Cloudflare tunnel
3. **Monitor memory usage** with `docker stats`
4. **Set up monitoring** alerts for OOM events

---

## Checklist

- [ ] Docker Engine installed
- [ ] zihan-server added to docker group
- [ ] Group membership applied (`newgrp docker`)
- [ ] Repository cloned to `~/docker-projects/maps_route_planner`
- [ ] docker-compose.yml analyzed
- [ ] docker-compose.yml modified with memory limits
- [ ] Frontend bound to 127.0.0.1:3000
- [ ] Memory limits: Frontend 256M, Backend 512M, OSRM 1024M
- [ ] Restart policies added to all services
- [ ] Containers built successfully
- [ ] Containers started and running
- [ ] Port 3000 listening on localhost
- [ ] Application accessible via curl
- [ ] Memory limits verified
- [ ] Systemd service created (optional)
- [ ] Systemd service enabled (optional)

---

## Contact

If you encounter any issues or need assistance with modifying [`docker-compose.yml`](docker-compose.yml), report back the file contents and I'll help you configure it correctly.
