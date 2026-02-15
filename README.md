# Maps Route Planner

A production-ready web application for route planning, vehicle simulation, and real-time location tracking.

## Features

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

## Tech Stack

- **Frontend**: Vanilla JavaScript + Leaflet.js
- **Backend**: Node.js + Express.js
- **Routing Engine**: OSRM (self-hosted in Docker)
- **Geocoding**: Nominatim (self-hosted in Docker)
- **Real-time**: Socket.io (WebSockets)
- **Database**: PostgreSQL + PostGIS (future)
- **Caching**: Redis (future)
- **Deployment**: Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git (for cloning)

### Local Development Options

#### Option 1: Quick Start (Recommended for Testing)
**Best for:** Quick testing without waiting hours for initialization
**Disk space:** ~500MB
**Startup time:** ~2 minutes

```bash
# Start with simplified dev configuration (uses public APIs)
docker-compose -f docker-compose.dev.yml up -d

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:3000
```

#### Option 2: Full Docker Deployment
**Best for:** Production-like environment with offline capability
**Disk space:** 7-10GB
**Startup time:** 2-4 hours (Nominatim initialization)

1. Clone the repository:
```bash
git clone <your-repo-url>
cd maps_testing
```

2. Create required directories:
```bash
mkdir -p data/osrm data/nominatim
```

3. Prepare OSRM data (⚠ IMPORTANT - Do this BEFORE docker-compose up):
```bash
cd docker/osrm
chmod +x extract.sh
./extract.sh
```

This will take:
- **Download**: 2-5 minutes (depends on internet speed)
- **Processing**: 5-15 minutes (depends on CPU)

4. Start all services:
```bash
docker-compose up -d
```

5. Access the application:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **OSRM API**: http://localhost:5000
- **Nominatim**: http://localhost:8080

### ⚠ Important Notes

- **Nominatim First Run**: Takes 2-4 hours to initialize on first run. During this time, geocoding/search will NOT work.
- **OSRM Data**: Must be prepared BEFORE running `docker-compose up` or the OSRM container will fail to start.
- **Disk Space**: Full deployment requires 7-10GB free space. Use Option 1 if you have limited space.

### 📚 Deployment Documentation

- [`DEPLOYMENT_FIXES.md`](DEPLOYMENT_FIXES.md) - Recent fixes and troubleshooting
- [`plans/deployment-plan.md`](plans/deployment-plan.md) - Detailed deployment guide
- [`DEPLOYMENT_ISSUES.md`](DEPLOYMENT_ISSUES.md) - Known issues and solutions

## Project Structure

```
maps_testing/
├── backend/           # Node.js backend
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/
│   │   ├── utils/
│   │   └── app.js
│   ├── package.json
│   └── Dockerfile
├── frontend/          # Static frontend
│   ├── css/
│   ├── js/
│   ├── index.html
│   └── build.sh
├── docker/            # Docker configurations
│   ├── nginx/
│   │   └── nginx.conf
│   └── osrm/
│       └── extract.sh
├── scripts/           # Utility scripts
│   └── backup.sh
├── data/             # Data volumes
│   ├── osrm/
│   └── nominatim/
├── docker-compose.yml          # Development configuration
├── docker-compose.dev.yml     # Quick start dev configuration (uses public APIs)
├── docker-compose.prod.yml     # Production configuration
├── .env
└── README.md
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Route Calculation
```
POST /api/route
Content-Type: application/json

{
  "start": "90.4125,23.8103",
  "end": "90.4000,23.8000"
}
```

### Location Search
```
GET /api/search?q=Dhaka
```

### ETA Calculation
```
POST /api/eta
Content-Type: application/json

{
  "distance": 5000,
  "speed": 40
}
```

## Production Deployment

See [`plans/deployment-plan.md`](plans/deployment-plan.md) for detailed production deployment instructions.

### Quick Production Setup

1. Configure environment:
```bash
cp .env.example .env
# Edit .env with production values
```

2. Build and start services:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

3. Setup Nginx reverse proxy (recommended):
```bash
sudo apt install nginx
# Configure /etc/nginx/sites-available/maps
sudo nginx -t
sudo systemctl restart nginx
```

4. Setup SSL with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Backup

Run automated backups:
```bash
chmod +x scripts/backup.sh
crontab -e
# Add: 0 2 * * * /path/to/maps_testing/scripts/backup.sh
```

## Updating OSM Data

### Update OSRM (monthly recommended)
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

### Nominatim Updates
Nominatim auto-updates daily (configured in docker-compose.yml).

## Troubleshooting

### OSRM Issues
```bash
docker logs osrm-backend
docker-compose restart osrm-backend
```

### Nominatim Issues
```bash
docker logs nominatim
# Wait for initialization (2-4 hours on first run)
```

### Port Conflicts
```bash
sudo lsof -i :3000
# Change ports in docker-compose.yml if needed
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
