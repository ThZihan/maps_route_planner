# Maps Route Planner

A production-ready web application for route planning, vehicle simulation, and real-time location tracking using OSRM routing engine and Nominatim geocoding service.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup Guide](#detailed-setup-guide)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)
- [Maintenance](#maintenance)

---

## ✨ Features

### Phase 1: Static Route Planning ✅
- Interactive map with click-to-select locations
- Search locations using geocoding
- Calculate shortest routes between two points
- Display total distance and estimated time
- Custom vehicle speed input

### Phase 2: Route Simulation ✅
- Animate vehicle marker along calculated route
- Play/pause/reset animation controls
- Variable animation speed
- Real-time progress display (distance covered, time elapsed, ETA)

### Phase 3: Real-Time Location Tracking (Future) 🚧
- Capture GPS location from mobile devices
- Stream location data to web application
- Display live position on map
- Calculate current speed from GPS data
- Show dynamic ETA based on current position and speed

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Vanilla JavaScript + Leaflet.js |
| **Backend** | Node.js + Express.js |
| **Routing Engine** | OSRM (self-hosted in Docker) |
| **Geocoding** | Nominatim (self-hosted in Docker) |
| **Real-time** | Socket.io (WebSockets) |
| **Database** | PostgreSQL + PostGIS (future) |
| **Caching** | Redis (future) |
| **Deployment** | Docker Compose |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Docker Desktop** - Download from [docker.com](https://www.docker.com/products/docker-desktop)
  - Docker must be running before starting the project
  - Minimum 8GB RAM recommended

- **Git** - Download from [git-scm.com](https://git-scm.com/downloads)
  - For cloning the repository

### System Requirements

- **Operating System**: Windows 10/11, macOS, or Linux
- **Disk Space**: 
  - Quick Start: ~500MB
  - Full Deployment: 7-10GB
- **RAM**: Minimum 8GB (16GB recommended)
- **Internet Connection**: Required for initial data download

---

## 🚀 Quick Start

### Option 1: Quick Start (Recommended for Testing)

**Best for:** Quick testing without waiting hours for initialization  
**Disk space:** ~500MB  
**Startup time:** ~2 minutes

#### Steps:

1. **Clone the repository**
   ```bash
   git clone https://github.com/ThZihan/maps_route_planner.git
   cd maps_route_planner
   ```

2. **Start with simplified dev configuration**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Access the application**
   - **Frontend**: http://localhost
   - **Backend API**: http://localhost:3000

4. **Stop the application**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

---

### Option 2: Full Docker Deployment

**Best for:** Production-like environment with offline capability  
**Disk space:** 7-10GB  
**Startup time:** 2-4 hours (Nominatim initialization)

#### Steps:

1. **Clone the repository**
   ```bash
   git clone https://github.com/ThZihan/maps_route_planner.git
   cd maps_route_planner
   ```

2. **Create required directories**
   ```bash
   mkdir -p data/osrm data/nominatim
   ```

3. **Prepare OSRM data** ⚠️ IMPORTANT - Do this BEFORE docker-compose up
   ```bash
   cd docker/osrm
   chmod +x extract.sh
   ./extract.sh
   ```

   This will take:
   - **Download**: 2-5 minutes (depends on internet speed)
   - **Processing**: 5-15 minutes (depends on CPU)

4. **Start all services**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   - **Frontend**: http://localhost
   - **Backend API**: http://localhost:3000
   - **OSRM API**: http://localhost:5000
   - **Nominatim**: http://localhost:8080

---

## 📖 Detailed Setup Guide

### Step-by-Step Instructions for Cloning and Running

#### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/ThZihan/maps_route_planner.git

# Navigate into the project directory
cd maps_route_planner
```

#### 2. Verify Docker is Running

```bash
# Check if Docker is running
docker ps

# If you see an error, start Docker Desktop and try again
```

#### 3. Create Environment File

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration (optional)
# Default values should work for local development
```

#### 4. Create Required Directories

```bash
# Create directories for OSRM and Nominatim data
mkdir -p data/osrm data/nominatim
```

#### 5. Prepare OSRM Data (Required for Full Deployment)

```bash
# Navigate to OSRM scripts directory
cd docker/osrm

# Make the extraction script executable (Linux/macOS)
chmod +x extract.sh

# Run the extraction script
./extract.sh
```

**What this script does:**
- Downloads Bangladesh OSM data from Geofabrik
- Processes the data with OSRM to create routing files
- Saves the processed files to `data/osrm/`

**Expected output:**
```
Downloading OSM data...
Extracting OSRM data...
Processing...
OSRM data preparation complete!
```

#### 6. Start Docker Containers

```bash
# Return to project root
cd ../..

# Start all services in detached mode
docker-compose up -d
```

**Expected output:**
```
Creating network "maps-testing_maps-network" ...
Creating volume "maps-testing_nominatim-data" ...
Creating volume "maps-testing_postgres-data" ...
Creating volume "maps-testing_redis-data" ...
Creating osrm-backend ...
Creating nominatim ...
Creating postgres ...
Creating redis ...
Creating backend ...
Creating frontend ...
```

#### 7. Verify Services are Running

```bash
# Check status of all containers
docker-compose ps
```

**Expected output:**
```
NAME            STATUS          PORTS
osrm-backend    Up 2 minutes    0.0.0.0:5000->5000/tcp
nominatim       Up 2 minutes    0.0.0.0:8080->8080/tcp
postgres        Up 2 minutes    0.0.0.0:5432->5432/tcp
redis           Up 2 minutes    0.0.0.0:6379->6379/tcp
backend         Up 2 minutes    0.0.0.0:3000->3000/tcp
frontend        Up 2 minutes    0.0.0.0:80->80/tcp
```

---

## 💻 Running the Project

### Using the Windows Batch File (.bat)

The easiest way to start the project on Windows is using the provided batch file.

#### Steps:

1. **Double-click `start.bat`**
   - Located in the project root directory
   - This will automatically:
     - Check if Docker is running
     - Start all Docker containers
     - Wait for services to be ready
     - Configure nginx
     - Open the application in your browser

2. **Or run from Command Prompt:**
   ```bash
   start.bat
   ```

#### What the Batch File Does:

```batch
@echo off
REM Maps Project Startup Script (Batch File)

1. Check if Docker is running
2. Start Docker containers (docker-compose up -d)
3. Wait for services to be ready (30 seconds)
4. Configure nginx (remove default.conf)
5. Display service status
6. Open browser at http://localhost
```

#### Expected Output:

```
========================================
  Maps Route Project - Startup Script
========================================

Checking Docker status...
Docker is running.

Starting Docker containers...
Docker containers started.

Waiting for services to be ready...
This may take a few minutes on first run...

Configuring nginx...
Nginx configured.

Service Status:
----------------------------------------
NAMES            STATUS          PORTS
osrm-backend     Up 2 minutes    0.0.0.0:5000->5000/tcp
nominatim        Up 2 minutes    0.0.0.0:8080->8080/tcp
backend          Up 2 minutes    0.0.0.0:3000->3000/tcp
frontend         Up 2 minutes    0.0.0.0:80->80/tcp

Opening application in browser...

========================================
  Application is ready!
========================================

Access the application at: http://localhost

To stop the application, run:
  docker-compose down

To view logs, run:
  docker-compose logs -f
```

### Using the PowerShell Script (.ps1)

For Windows users with PowerShell:

```powershell
# Run the PowerShell script
.\start-project.ps1
```

**Note:** You may need to enable script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Manual Startup

If you prefer to start services manually:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## 📁 Project Structure

```
maps_route_planner/
├── backend/                    # Node.js backend API
│   ├── src/
│   │   ├── app.js             # Express application entry point
│   │   ├── controllers/       # Route controllers
│   │   │   └── routeController.js
│   │   ├── middleware/        # Custom middleware
│   │   │   └── errorHandler.js
│   │   ├── routes/            # API routes
│   │   │   └── index.js
│   │   ├── services/          # External service integrations
│   │   │   ├── nominatimService.js
│   │   │   └── osrmService.js
│   │   ├── socket/            # WebSocket handlers
│   │   │   └── socketHandler.js
│   │   └── utils/             # Utility functions
│   │       └── logger.js
│   ├── package.json           # Backend dependencies
│   ├── package-lock.json
│   └── Dockerfile             # Backend Docker configuration
│
├── frontend/                   # Static frontend files
│   ├── css/
│   │   └── style.css          # Main stylesheet
│   ├── js/
│   │   ├── map.js             # Map initialization and interaction
│   │   ├── route.js           # Route calculation logic
│   │   └── animation.js       # Vehicle animation logic
│   ├── index.html             # Main HTML file
│   ├── test-click.html        # Testing page
│   ├── build.sh               # Build script
│   └── FLOWING_WATER_ANIMATION.md  # Animation documentation
│
├── docker/                     # Docker configurations
│   ├── nginx/
│   │   └── nginx.conf         # Nginx configuration
│   └── osrm/
│       └── extract.sh         # OSRM data extraction script
│
├── scripts/                    # Utility scripts
│   └── backup.sh               # Database backup script
│
├── data/                       # Data volumes (gitignored)
│   ├── osrm/                  # OSRM routing data
│   └── nominatim/             # Nominatim geocoding data
│
├── plans/                      # Planning documents
│   └── deployment-plan.md     # Deployment guide
│
├── screenshots/                # Project screenshots
│
├── docker-compose.yml          # Main Docker Compose configuration
├── docker-compose.dev.yml     # Development configuration (quick start)
├── docker-compose.prod.yml     # Production configuration
├── .env                       # Environment variables (gitignored)
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── start.bat                  # Windows startup script
├── start-project.ps1          # PowerShell startup script
├── README.md                  # This file
├── STARTUP_GUIDE.md           # Startup guide
├── DEPLOYMENT_FIXES.md        # Deployment fixes
├── DEPLOYMENT_ISSUES.md       # Known issues
└── DEPLOYMENT_RESULTS.md      # Deployment results
```

---

## 🔌 API Endpoints

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Route Calculation
```http
POST /api/route
Content-Type: application/json

{
  "start": "90.4125,23.8103",
  "end": "90.4000,23.8000"
}
```

**Response:**
```json
{
  "route": {
    "distance": 5234.5,
    "duration": 785.2,
    "geometry": "...encoded polyline..."
  }
}
```

### Location Search
```http
GET /api/search?q=Dhaka
```

**Response:**
```json
{
  "results": [
    {
      "display_name": "Dhaka, Bangladesh",
      "lat": 23.8103,
      "lon": 90.4125
    }
  ]
}
```

### ETA Calculation
```http
POST /api/eta
Content-Type: application/json

{
  "distance": 5000,
  "speed": 40
}
```

**Response:**
```json
{
  "eta": 450
}
```

---

## 🔧 Troubleshooting

### Docker Issues

#### Docker is not running
```bash
# Check Docker status
docker ps

# If error, start Docker Desktop
# Windows: Start Docker Desktop from Start menu
# macOS: Open Docker Desktop from Applications
# Linux: sudo systemctl start docker
```

#### Container won't start
```bash
# View container logs
docker-compose logs <service-name>

# Example: View OSRM logs
docker-compose logs osrm-backend

# Restart specific service
docker-compose restart <service-name>
```

#### Port already in use
```bash
# Find process using the port
# Windows
netstat -ano | findstr :3000

# Linux/macOS
lsof -i :3000

# Change port in docker-compose.yml
# Modify the ports section for the conflicting service
```

### OSRM Issues

#### OSRM container fails to start
```bash
# Check if OSRM data exists
ls -la data/osrm/

# If missing, prepare OSRM data
cd docker/osrm
./extract.sh

# Restart OSRM container
docker-compose restart osrm-backend
```

#### OSRM data is outdated
```bash
# Update OSRM data (monthly recommended)
cd data/osrm
wget https://download.geofabrik.de/asia/bangladesh-latest.osm.pbf -O bangladesh-latest-new.osm.pbf
docker-compose stop osrm-backend
mv bangladesh-latest.osm.pbf bangladesh-latest-old.osm.pbf
mv bangladesh-latest-new.osm.pbf bangladesh-latest.osm.pbf
cd ../../docker/osrm
./extract.sh
docker-compose start osrm-backend
```

### Nominatim Issues

#### Nominatim takes too long to initialize
```bash
# This is normal on first run (2-4 hours)
# Check initialization progress
docker logs nominatim -f

# Wait until you see: "Nominatim is ready to accept requests"
```

#### Geocoding/search not working
```bash
# Check Nominatim is running
docker-compose ps nominatim

# Check Nominatim logs
docker-compose logs nominatim

# Test Nominatim directly
curl http://localhost:8080/search?q=Dhaka
```

### Backend Issues

#### Backend returns connection errors
```bash
# Check backend logs
docker-compose logs backend

# Verify OSRM is accessible from backend
docker-compose exec backend curl http://osrm-backend:5000

# Verify Nominatim is accessible from backend
docker-compose exec backend curl http://nominatim:8080
```

### Frontend Issues

#### Page won't load
```bash
# Check frontend is running
docker-compose ps frontend

# Check nginx logs
docker-compose logs frontend

# Verify nginx configuration
docker-compose exec frontend nginx -t
```

### Common Error Messages

| Error | Solution |
|-------|----------|
| `Cannot connect to the Docker daemon` | Start Docker Desktop |
| `Port 3000 is already allocated` | Change port in docker-compose.yml |
| `No such file or directory: data/osrm/bangladesh-latest.osrm` | Run OSRM data extraction script |
| `Connection refused` on API calls | Verify all containers are running |
| `502 Bad Gateway` | Check backend is running and accessible |

---

## 🌐 Deployment

### Production Deployment

See [`plans/deployment-plan.md`](plans/deployment-plan.md) for detailed production deployment instructions.

### Quick Production Setup

1. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Build and start services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

3. **Setup Nginx reverse proxy (recommended)**
   ```bash
   sudo apt install nginx
   # Configure /etc/nginx/sites-available/maps
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Deployment Documentation

- [`DEPLOYMENT_FIXES.md`](DEPLOYMENT_FIXES.md) - Recent fixes and troubleshooting
- [`plans/deployment-plan.md`](plans/deployment-plan.md) - Detailed deployment guide
- [`DEPLOYMENT_ISSUES.md`](DEPLOYMENT_ISSUES.md) - Known issues and solutions
- [`DEPLOYMENT_RESULTS.md`](DEPLOYMENT_RESULTS.md) - Deployment results

---

## 🔄 Maintenance

### Backup

Run automated backups:
```bash
# Make backup script executable
chmod +x scripts/backup.sh

# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/maps_route_planner/scripts/backup.sh
```

### Updating OSM Data

#### Update OSRM (monthly recommended)
```bash
cd data/osrm
wget https://download.geofabrik.de/asia/bangladesh-latest.osm.pbf -O bangladesh-latest-new.osm.pbf
docker-compose stop osrm-backend
mv bangladesh-latest.osm.pbf bangladesh-latest-old.osm.pbf
mv bangladesh-latest-new.osm.pbf bangladesh-latest.osm.pbf
cd ../../docker/osrm
./extract.sh
docker-compose start osrm-backend
```

#### Nominatim Updates
Nominatim auto-updates daily (configured in docker-compose.yml).

### Monitoring

#### View all container logs
```bash
docker-compose logs -f
```

#### View specific service logs
```bash
docker-compose logs -f backend
docker-compose logs -f osrm-backend
docker-compose logs -f nominatim
```

#### Check container resource usage
```bash
docker stats
```

---

## ⚠️ Important Notes

### First Run Considerations

- **Nominatim First Run**: Takes 2-4 hours to initialize on first run. During this time, geocoding/search will NOT work.
- **OSRM Data**: Must be prepared BEFORE running `docker-compose up` or the OSRM container will fail to start.
- **Disk Space**: Full deployment requires 7-10GB free space. Use Option 1 (Quick Start) if you have limited space.

### Performance Tips

- **RAM**: Allocate at least 8GB to Docker Desktop for optimal performance
- **CPU**: OSRM data processing benefits from multiple CPU cores
- **Network**: Ensure stable internet connection for initial data download

### Security

- **Environment Variables**: Never commit `.env` file to version control
- **Default Passwords**: Change default passwords in production
- **SSL**: Always use HTTPS in production
- **Firewall**: Configure firewall rules to restrict access

---

## 📄 License

ISC

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow existing code style
- Add comments for complex logic
- Update documentation for new features
- Test changes before submitting

---

## 📞 Support

If you encounter any issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review [deployment documentation](#deployment-documentation)
3. Check [GitHub Issues](https://github.com/ThZihan/maps_route_planner/issues)
4. Open a new issue with detailed information

---

## 🙏 Acknowledgments

- [OSRM](http://project-osrm.org/) - Open Source Routing Machine
- [Nominatim](https://nominatim.org/) - OpenStreetMap Geocoding Service
- [Leaflet](https://leafletjs.com/) - Open-source JavaScript library for mobile-friendly interactive maps
- [OpenStreetMap](https://www.openstreetmap.org/) - Free map of the world
