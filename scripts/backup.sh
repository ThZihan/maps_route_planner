#!/bin/bash
BACKUP_DIR="/home/user/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec postgres pg_dump -U mapsuser mapsdb > $BACKUP_DIR/postgres_$DATE.sql

# Backup OSRM data (only if you customized it)
tar -czf $BACKUP_DIR/osrm_$DATE.tar.gz data/osrm/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
