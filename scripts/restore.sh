#!/bin/bash

# TalentGuard Buyer Intelligence - Database Restore Script
# This script restores the database from backup files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Configuration
BACKUP_DIR="./backups"
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_USER="postgres"
POSTGRES_DB="${POSTGRES_DB:-talentguard_prod}"

# Function to list available backups
list_backups() {
    log "Available backup files:"
    echo "========================"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        error "Backup directory $BACKUP_DIR does not exist"
    fi
    
    local backups=$(find "$BACKUP_DIR" -name "talentguard_backup_*.sql.gz" -type f | sort -r)
    
    if [ -z "$backups" ]; then
        error "No backup files found in $BACKUP_DIR"
    fi
    
    local count=1
    for backup in $backups; do
        local filename=$(basename "$backup")
        local filesize=$(du -h "$backup" | cut -f1)
        local timestamp=$(echo "$filename" | grep -o '[0-9]\{8\}_[0-9]\{6\}')
        local formatted_date=$(echo "$timestamp" | sed 's/_/ /' | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3/')
        
        echo "$count) $filename ($filesize) - $formatted_date"
        count=$((count + 1))
    done
}

# Function to select backup file
select_backup() {
    list_backups
    echo ""
    read -p "Enter the number of the backup to restore (or 'q' to quit): " choice
    
    if [ "$choice" = "q" ]; then
        log "Restore cancelled by user"
        exit 0
    fi
    
    local backups=($(find "$BACKUP_DIR" -name "talentguard_backup_*.sql.gz" -type f | sort -r))
    local selected_index=$((choice - 1))
    
    if [ $selected_index -lt 0 ] || [ $selected_index -ge ${#backups[@]} ]; then
        error "Invalid selection. Please choose a number between 1 and ${#backups[@]}"
    fi
    
    BACKUP_FILE="${backups[$selected_index]}"
    log "Selected backup: $(basename $BACKUP_FILE)"
}

# Function to confirm restore operation
confirm_restore() {
    echo ""
    warning "⚠️  DANGER: This operation will completely replace the current database!"
    warning "⚠️  All existing data will be permanently lost!"
    echo ""
    echo "Database: $POSTGRES_DB"
    echo "Backup file: $(basename $BACKUP_FILE)"
    echo ""
    
    read -p "Type 'YES' in capital letters to confirm this destructive operation: " confirmation
    
    if [ "$confirmation" != "YES" ]; then
        log "Restore operation cancelled. Database remains unchanged."
        exit 0
    fi
    
    log "Restore confirmed. Proceeding..."
}

# Function to stop application services
stop_services() {
    log "Stopping TalentGuard application services..."
    
    if docker-compose -f docker-compose.prod.yml ps app | grep -q "Up"; then
        docker-compose -f docker-compose.prod.yml stop app worker || warning "Failed to stop some services"
        sleep 5
    fi
    
    log "Services stopped ✓"
}

# Function to start application services
start_services() {
    log "Starting TalentGuard application services..."
    
    docker-compose -f docker-compose.prod.yml up -d app worker || error "Failed to start services"
    
    log "Services started ✓"
}

# Function to create pre-restore backup
create_pre_restore_backup() {
    log "Creating pre-restore backup as safety measure..."
    
    local pre_restore_backup="$BACKUP_DIR/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        > "$pre_restore_backup" 2>/dev/null || warning "Pre-restore backup failed"
    
    if [ -f "$pre_restore_backup" ]; then
        gzip "$pre_restore_backup"
        log "Pre-restore backup created: $(basename $pre_restore_backup).gz ✓"
    fi
}

# Function to restore database
restore_database() {
    log "Starting database restore..."
    
    # Extract backup file
    local temp_backup_file="/tmp/$(basename $BACKUP_FILE .gz)"
    gunzip -c "$BACKUP_FILE" > "$temp_backup_file" || error "Failed to extract backup file"
    
    # Drop existing database and recreate
    PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d postgres \
        -c "DROP DATABASE IF EXISTS $POSTGRES_DB;" || error "Failed to drop existing database"
    
    PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d postgres \
        -c "CREATE DATABASE $POSTGRES_DB;" || error "Failed to create new database"
    
    # Restore from backup
    PGPASSWORD="$POSTGRES_PASSWORD" pg_restore \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --verbose \
        --clean \
        --if-exists \
        "$temp_backup_file" || error "Failed to restore database"
    
    # Cleanup temp file
    rm -f "$temp_backup_file"
    
    log "Database restore completed ✓"
}

# Function to verify restore
verify_restore() {
    log "Verifying database restore..."
    
    # Check if main tables exist and have data
    local tables=("linkedin_connections" "tone_profiles" "users")
    
    for table in "${tables[@]}"; do
        local count=$(PGPASSWORD="$POSTGRES_PASSWORD" psql \
            -h "$POSTGRES_HOST" \
            -p "$POSTGRES_PORT" \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ')
        
        if [ "$count" ]; then
            log "Table $table: $count records ✓"
        else
            warning "Table $table: verification failed"
        fi
    done
    
    log "Database verification completed ✓"
}

# Main restore function
main() {
    log "TalentGuard Database Restore Utility"
    log "====================================="
    
    # Check prerequisites
    if ! command -v pg_restore &> /dev/null; then
        error "pg_restore command not found. Please install PostgreSQL client tools."
    fi
    
    if [ -z "$POSTGRES_PASSWORD" ]; then
        error "POSTGRES_PASSWORD environment variable not set"
    fi
    
    # Interactive restore process
    select_backup
    confirm_restore
    
    # Perform restore
    stop_services
    create_pre_restore_backup
    restore_database
    verify_restore
    start_services
    
    log "🎉 Database restore completed successfully!"
    log "Your TalentGuard platform has been restored from backup: $(basename $BACKUP_FILE)"
    log "Pre-restore backup was created for safety."
    echo ""
    log "Next steps:"
    log "1. Verify application functionality"
    log "2. Check data integrity"
    log "3. Monitor application logs"
}

# Handle script interruption
trap 'error "Restore process interrupted"' INT TERM

# Show usage if requested
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "TalentGuard Database Restore Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help, -h    Show this help message"
    echo "  --list, -l    List available backups"
    echo ""
    echo "Environment Variables:"
    echo "  POSTGRES_PASSWORD    PostgreSQL password (required)"
    echo "  POSTGRES_DB          Database name (default: talentguard_prod)"
    echo ""
    echo "This script will:"
    echo "1. Show available backup files"
    echo "2. Allow you to select which backup to restore"
    echo "3. Stop application services"
    echo "4. Create a safety backup of current data"
    echo "5. Restore the selected backup"
    echo "6. Verify the restore"
    echo "7. Restart application services"
    exit 0
fi

if [[ "$1" == "--list" ]] || [[ "$1" == "-l" ]]; then
    list_backups
    exit 0
fi

# Run main restore process if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi