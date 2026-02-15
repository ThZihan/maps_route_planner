# Docker Desktop Troubleshooting Guide

## Issue: Docker Desktop is unable to start

### Quick Fixes (Try in Order)

### 1. Restart Docker Desktop
1. Right-click the Docker whale icon in system tray
2. Select "Quit Docker Desktop"
3. Wait 10 seconds
4. Reopen Docker Desktop from Start menu

### 2. Check WSL 2 Status
Docker Desktop on Windows uses WSL 2. Verify it's working:

```cmd
wsl --status
```

If WSL 2 is not installed or not working:
```cmd
wsl --install
```
Then restart your computer.

### 3. Enable WSL 2 Features
Open PowerShell as Administrator and run:

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

Restart your computer after running these commands.

### 4. Set WSL 2 as Default
```cmd
wsl --set-default-version 2
```

### 5. Check Virtualization in BIOS
1. Open Task Manager (Ctrl+Shift+Esc)
2. Go to Performance tab
3. Click CPU
4. Check if "Virtualization" is enabled

If disabled:
1. Restart your computer
2. Enter BIOS/UEFI setup (usually F2, F10, F12, or Del)
3. Enable Virtualization Technology (Intel VT-x or AMD-V)
4. Save and restart

### 6. Reset Docker Desktop
1. Open Docker Desktop
2. Go to Settings (gear icon)
3. Navigate to "Troubleshoot"
4. Click "Clean / Purge data"
5. Click "Clean / Purge data" to confirm
6. Restart Docker Desktop

### 7. Check Windows Features
1. Press Win+R, type `optionalfeatures`
2. Ensure these are checked:
   - ☑️ Windows Subsystem for Linux
   - ☑️ Virtual Machine Platform
   - ☑️ Hyper-V (if available)
3. Click OK and restart

### 8. Disable VPN/Proxy
VPN or proxy software can interfere with Docker:
1. Temporarily disable any VPN
2. Disable proxy in Windows Settings
3. Restart Docker Desktop

### 9. Update Windows
1. Go to Settings → Windows Update
2. Check for updates
3. Install all pending updates
4. Restart your computer

### 10. Check Docker Logs
1. Open Docker Desktop
2. Click the whale icon → Troubleshoot → Diagnose & Feedback
3. Review the logs for specific error messages

---

## Alternative: Use WSL 2 Backend

If Docker Desktop continues to fail, you can use WSL 2 directly:

1. Install Ubuntu on WSL 2:
```cmd
wsl --install -d Ubuntu
```

2. After installation and restart, open Ubuntu terminal and install Docker:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

3. Then run your Docker commands from WSL 2 Ubuntu terminal.

---

## Common Error Messages

### "Error response from daemon: open //./pipe/dockerDesktopLinuxEngine"
**Cause**: Docker daemon not running
**Solution**: Restart Docker Desktop, check WSL 2 status

### "Docker Desktop failed to start"
**Cause**: WSL 2 or virtualization issues
**Solution**: Enable WSL 2 features, check BIOS virtualization

### "Hyper-V is not available"
**Cause**: Hyper-V disabled or not supported
**Solution**: Enable Virtual Machine Platform in Windows Features

### "WSL 2 requires an update"
**Cause**: Outdated WSL 2 kernel
**Solution**: Run `wsl --update` and restart

---

## Getting Help

If none of these solutions work:

1. **Check Docker Desktop logs**:
   - Help → Troubleshoot → Diagnose & Feedback

2. **Check Windows Event Viewer**:
   - Press Win+R, type `eventvwr`
   - Look for Docker-related errors in Application logs

3. **Docker Community Forums**:
   https://forums.docker.com/

4. **Docker Desktop Documentation**:
   https://docs.docker.com/desktop/troubleshoot/
