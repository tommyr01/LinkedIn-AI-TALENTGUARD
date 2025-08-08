#!/bin/bash

# TalentGuard Buyer Intelligence - Database Backup Script
# This script creates automated backups of the production database

set -e

# Configuration
BACKUP_DIR="/backups"
POSTGRES_HOST="postgres"
POSTGRES_PORT="5432"
POSTGRES_USER="postgres"
POSTGRES_DB="${POSTGRES_DB:-talentguard_prod}"
RETENTION_DAYS=30

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Create timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/talentguard_backup_$TIMESTAMP.sql"
BACKUP_FILE_COMPRESSED="$BACKUP_FILE.gz"

echo "Starting database backup at $(date)"

# Create database dump
pg_dump \
    -h "$POSTGRES_HOST" \
    -p "$POSTGRES_PORT" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --no-password \
    --format=custom \
    --compress=9 \
    --verbose \
    > "$BACKUP_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "Database backup completed successfully: $BACKUP_FILE"
    
    # Compress the backup
    gzip "$BACKUP_FILE"
    echo "Backup compressed: $BACKUP_FILE_COMPRESSED"
    
    # Set appropriate permissions
    chmod 600 "$BACKUP_FILE_COMPRESSED"
    
    # Remove old backups
    find "$BACKUP_DIR" -name "talentguard_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "Old backups cleaned up (retention: $RETENTION_DAYS days)"
    
    # Log backup completion
    echo "Backup completed successfully at $(date)"
    
    # Optional: Upload to cloud storage (uncomment if needed)
    # aws s3 cp "$BACKUP_FILE_COMPRESSED" s3://your-backup-bucket/talentguard/
    
else
    echo "ERROR: Database backup failed at $(date)"
    exit 1
fi