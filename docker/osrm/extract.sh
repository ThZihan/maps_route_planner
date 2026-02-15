#!/bin/bash

# Download Bangladesh OSM data
echo "Downloading Bangladesh OSM data (~200MB)..."
wget https://download.geofabrik.de/asia/bangladesh-latest.osm.pbf -O ../../data/osrm/bangladesh-latest.osm.pbf

echo "Extracting OSRM data..."
# Extract OSRM data using Docker
docker run -t -v "${PWD}/../../data/osrm:/data" osrm/osrm-backend:latest \
  osrm-extract -p /opt/car.lua /data/bangladesh-latest.osm.pbf

echo "Preparing routing data..."
# Prepare routing data
docker run -t -v "${PWD}/../../data/osrm:/data" osrm/osrm-backend:latest \
  osrm-partition /data/bangladesh-latest.osrm

docker run -t -v "${PWD}/../../data/osrm:/data" osrm/osrm-backend:latest \
  osrm-customize /data/bangladesh-latest.osrm

echo "OSRM data preparation complete!"
