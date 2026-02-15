# Docker Desktop Installation Guide for Windows

This guide provides step-by-step instructions for installing Docker Desktop on Windows to deploy the Maps project.

---

## Prerequisites

Before installing Docker Desktop, ensure your system meets the following requirements:

### System Requirements
- **Windows 10/11**: 64-bit version with:
  - Home, Pro, Enterprise, or Education edition
  - Build 19041 or higher (Windows 10)
  - Any build (Windows 11)
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: 10GB+ free space
- **Virtualization**: Must be enabled in BIOS

### Check Virtualization Support
```cmd
systeminfo
```
Look for "Virtualization Enabled In Firmware: Yes"

If virtualization is disabled:
1. Restart your computer
2. Enter BIOS/UEFI setup (usually F2, F10, F12, or Del key)
3. Find Virtualization Technology (Intel VT-x or AMD-V)
4. Enable it and save changes

---

## Installation Steps

### Step 1: Download Docker Desktop

1. Visit the official Docker website: https://www.docker.com/products/docker-desktop/
2. Click the "Download for Windows" button
3. Wait for the download to complete (~500MB)

### Step 2: Install Docker Desktop

1. **Run the installer**:
   - Double-click `Docker Desktop Installer.exe`
   - Click "OK" if prompted by User Account Control

2. **Configuration options**:
   - ☑️ **Use WSL 2 instead of Hyper-V** (Recommended - better performance)
   - ☑️ **Add shortcut to desktop**
   - ☑️ **Automatically check for updates**

3. **Click "Ok"** to start the installation

4. **Wait for installation**:
   - This may take 5-10 minutes
   - The installer will download WSL 2 components if needed

5. **Restart your computer** when prompted

### Step 3: Complete Setup After Restart

1. **Launch Docker Desktop**:
   - Double-click the Docker Desktop icon
   - Or search for "Docker Desktop" in Start menu

2. **Accept the Service Agreement**:
   - Read and accept the Docker Desktop Service Agreement

3. **Wait for initialization**:
   - Docker will start automatically
   - Look for the Docker whale icon in the system tray
   - Wait until it shows green (running)

---

## Verification

### Step 1: Verify Docker Installation

Open Command Prompt or PowerShell and run:

```cmd
docker --version
```

Expected output:
```
Docker version 27.x.x, build xxxxxxx
```

### Step 2: Verify Docker Compose

```cmd
docker-compose --version
```

Expected output:
```
Docker Compose version v2.x.x
```

### Step 3: Test Docker with Hello World

```cmd
docker run hello-world
```

Expected output:
```
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
...
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

---

## Docker Desktop Configuration

### Recommended Settings

1. **Open Docker Desktop Settings**:
   - Click the Docker whale icon in system tray
   - Select "Settings"

2. **Resources**:
   - **Memory**: Allocate at least 4GB (8GB recommended for this project)
   - **Processors**: Allocate at least 2 cores
   - **Disk image size**: 60GB+ (for OSRM and Nominatim data)

3. **File Sharing**:
   - Add your project directory: `d:\projects\maps_testing`
   - This allows Docker to access your project files

4. **Network**:
   - Ensure "Use WSL 2 based engine" is enabled
   - This provides better performance and compatibility

---

## Troubleshooting

### Issue: "WSL 2 installation is incomplete"

**Solution:**
```cmd
wsl --update
wsl --set-default-version 2
```
Then restart Docker Desktop.

### Issue: "Virtualization is disabled"

**Solution:**
1. Restart your computer
2. Enter BIOS/UEFI setup
3. Enable Virtualization Technology (Intel VT-x or AMD-V)
4. Save and restart

### Issue: Docker daemon won't start

**Solution:**
1. Check Windows Firewall isn't blocking Docker
2. Restart Docker Desktop from system tray
3. Run as Administrator:
   ```cmd
   net stop com.docker.service
   net start com.docker.service
   ```

### Issue: "Access denied" when running docker commands

**Solution:**
1. Ensure your user is in the `docker-users` group
2. Restart your computer after installation
3. Run Command Prompt as Administrator

### Issue: Low disk space warnings

**Solution:**
1. Clean up unused Docker resources:
   ```cmd
   docker system prune -a
   ```
2. Increase disk image size in Docker Desktop Settings → Resources

---

## Next Steps After Installation

Once Docker Desktop is installed and verified:

1. **Navigate to your project directory**:
   ```cmd
   cd d:\projects\maps_testing
   ```

2. **Download and prepare OSRM data** (CRITICAL - must do before starting services):
   ```cmd
   cd docker\osrm
   .\extract.sh
   ```

3. **Start all services**:
   ```cmd
   cd d:\projects\maps_testing
   docker-compose up -d
   ```

4. **Check service status**:
   ```cmd
   docker-compose ps
   ```

5. **View logs**:
   ```cmd
   docker-compose logs -f
   ```

---

## Useful Docker Commands

```cmd
# List all running containers
docker ps

# List all containers (including stopped)
docker ps -a

# View container logs
docker logs <container-name>

# Stop all services
docker-compose down

# Stop and remove all volumes (WARNING: deletes data)
docker-compose down -v

# View resource usage
docker stats

# Clean up unused resources
docker system prune -a
```

---

## Additional Resources

- [Docker Desktop Documentation](https://docs.docker.com/desktop/windows/)
- [WSL 2 Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

## Support

If you encounter issues during installation:
1. Check Docker Desktop logs: Help → Troubleshoot → Diagnose & Feedback
2. Visit Docker Community Forums: https://forums.docker.com/
3. Check Windows Event Viewer for Docker-related errors
