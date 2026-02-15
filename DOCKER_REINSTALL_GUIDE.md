# Docker Desktop Reinstallation Guide - Moving to D: Drive

## Problem

Docker Desktop is installed on **C: drive** (only 1.80 GB free) but your project is on **D: drive** (158 GB free). Docker Desktop cannot write logs to C: drive due to insufficient space.

## Solution: Reinstall Docker Desktop on D: Drive

Follow these steps to completely reinstall Docker Desktop on D: drive:

---

## Step 1: Stop All Docker Containers

Open Command Prompt or PowerShell as Administrator and run:

```cmd
cd /d d:\projects\maps_testing
docker-compose down
```

This will stop all running containers and remove them.

---

## Step 2: Uninstall Docker Desktop

1. Open **Settings** → **Apps** → **Installed Apps**

2. Find **Docker Desktop** in the list

3. Click **Uninstall**

4. Follow the uninstall wizard to complete removal

5. Restart your computer (recommended)

---

## Step 3: Download Docker Desktop for Windows

1. Go to: https://www.docker.com/products/docker-desktop/

2. Click **Download for Windows**

3. Wait for the download to complete (DockerDesktopInstaller.exe)

---

## Step 4: Install Docker Desktop on D: Drive

1. Run **DockerDesktopInstaller.exe** as Administrator

2. During installation, when prompted for installation location:
   - Click **Browse...**
   - Navigate to **D:**
   - Create a new folder named **Docker**
   - Select **D:\Docker** as the installation location
   - Click **Select Folder**

3. Complete the installation wizard

4. When installation completes, click **Close and restart**

5. Your computer will restart automatically

---

## Step 5: Verify Docker Desktop Installation

After your computer restarts:

1. Open **Docker Desktop** from Start menu

2. Check the settings:
   - Click the Docker Desktop icon in system tray
   - Go to **Settings** → **Resources** → **Advanced**
   - Verify that "Disk image location" shows: `D:\Docker`

3. Accept the license agreement if prompted

---

## Step 6: Start Docker Containers

1. Open Command Prompt or PowerShell

2. Navigate to your project:
```cmd
cd /d d:\projects\maps_testing
```

3. Start all services:
```cmd
docker-compose up -d
```

4. Verify all containers are running:
```cmd
docker-compose ps
```

---

## Expected Result

All Docker containers will now run on D: drive with 158 GB available space:

| Service | Status | Port |
|----------|--------|------|
| backend | Running | 3000 |
| frontend | Running | 80 |
| osrm-backend | Running | 5000 |
| postgres | Running | 5432 |
| redis | Running | 6379 |
| nominatim | Initializing | 8080 |

---

## Access Your Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **OSRM API**: http://localhost:5000
- **Nominatim**: http://localhost:8080

---

## Troubleshooting

### If containers don't start:

```cmd
# Check Docker Desktop is running
docker info

# Check container logs
docker-compose logs
```

### If Docker Desktop won't start:

1. Check Windows Services:
   - Press Win+R, type `services.msc`
   - Look for "Docker Desktop Service"
   - Ensure it's running

2. Check Docker Desktop logs:
   - Location: `D:\Docker\log\vm\init.log`
   - Look for error messages

### If you see "Access Denied" errors:

- Run Command Prompt as Administrator
- Ensure your user has proper permissions

---

## Summary

After completing these steps:
- ✅ Docker Desktop installed on D: drive (158 GB free)
- ✅ All containers running successfully
- ✅ Application accessible at http://localhost
- ✅ No more disk space issues on C: drive
