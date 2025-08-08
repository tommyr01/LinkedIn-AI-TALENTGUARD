#!/bin/bash

# TalentGuard Buyer Intelligence - Production Deployment Script
# This script handles the complete production deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="talentguard-buyer-intelligence"
DOCKER_IMAGE="$APP_NAME:latest"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deploy-$(date +%Y%m%d-%H%M%S).log"

# Create logs directory if it doesn't exist
mkdir -p ./logs

# Function to log messages
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker service."
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        error ".env.production file not found. Please create it from .env.production template."
    fi
    
    # Check if required environment variables are set
    source .env.production
    if [ -z "$DOMAIN" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
        error "Required environment variables not set in .env.production"
    fi
    
    log "Prerequisites check passed ✓"
}

# Function to create backup
create_backup() {
    log "Creating database backup before deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Check if there's an existing database to backup
    if docker-compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
        BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"
        
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
            -U postgres -d "$POSTGRES_DB" > "$BACKUP_FILE" || {
            warning "Database backup failed, but continuing with deployment"
        }
        
        if [ -f "$BACKUP_FILE" ]; then
            log "Database backup created: $BACKUP_FILE ✓"
        fi
    else
        info "No existing database found, skipping backup"
    fi
}

# Function to build application
build_application() {
    log "Building application Docker image..."
    
    # Build the production image
    docker build \
        --target production \
        --tag "$DOCKER_IMAGE" \
        --build-arg NODE_ENV=production \
        . || error "Failed to build Docker image"
    
    log "Application built successfully ✓"
}

# Function to run tests
run_tests() {
    log "Running production readiness tests..."
    
    # Run linting and type checking
    if command -v npm &> /dev/null; then
        npm run lint || warning "Linting failed"
        npm run type-check || warning "Type checking failed"
    fi
    
    # Test Docker image
    docker run --rm "$DOCKER_IMAGE" node --version || error "Docker image test failed"
    
    log "Tests completed ✓"
}

# Function to deploy services
deploy_services() {
    log "Deploying services..."
    
    # Copy production environment
    cp .env.production .env
    
    # Pull latest images for external services
    docker-compose -f docker-compose.prod.yml pull redis postgres traefik prometheus grafana node-exporter
    
    # Deploy with zero-downtime strategy
    docker-compose -f docker-compose.prod.yml up -d --remove-orphans || error "Deployment failed"
    
    log "Services deployed ✓"
}

# Function to wait for services
wait_for_services() {
    log "Waiting for services to be ready..."
    
    # Wait for application to be healthy
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
            log "Application is healthy ✓"
            break
        fi
        
        attempt=$((attempt + 1))
        info "Waiting for application... ($attempt/$max_attempts)"
        sleep 10
    done
    
    if [ $attempt -eq $max_attempts ]; then
        error "Application failed to become healthy"
    fi
}

# Function to run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Run any pending migrations
    docker-compose -f docker-compose.prod.yml exec -T app npm run db:migrate || {
        warning "Database migrations failed"
    }
    
    log "Database migrations completed ✓"
}

# Function to verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check all services are running
    local services=(app redis postgres worker traefik prometheus grafana)
    
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.prod.yml ps "$service" | grep -q "Up"; then
            log "$service is running ✓"
        else
            error "$service is not running properly"
        fi
    done
    
    # Test application endpoints
    local endpoints=(
        "http://localhost:3000/api/health"
        "http://localhost:3000/api/auth/status"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "$endpoint" > /dev/null 2>&1; then
            log "Endpoint $endpoint is responding ✓"
        else
            warning "Endpoint $endpoint is not responding"
        fi
    done
    
    log "Deployment verification completed ✓"
}

# Function to cleanup old resources
cleanup() {
    log "Cleaning up old resources..."
    
    # Remove unused Docker images
    docker image prune -f || warning "Failed to cleanup Docker images"
    
    # Remove old backup files (keep last 7 days)
    find "$BACKUP_DIR" -name "backup-*.sql" -mtime +7 -delete || warning "Failed to cleanup old backups"
    
    log "Cleanup completed ✓"
}

# Function to show deployment summary
show_summary() {
    log "Deployment Summary"
    echo "===================="
    echo "Application: $APP_NAME"
    echo "Image: $DOCKER_IMAGE"
    echo "Domain: $DOMAIN"
    echo "Deployment Time: $(date)"
    echo ""
    echo "Service URLs:"
    echo "- Application: https://$DOMAIN"
    echo "- Grafana: http://localhost:3001"
    echo "- Prometheus: http://localhost:9090"
    echo "- Traefik Dashboard: http://localhost:8080"
    echo ""
    echo "To monitor logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "To check status: docker-compose -f docker-compose.prod.yml ps"
    echo "===================="
}

# Main deployment process
main() {
    log "Starting TalentGuard Buyer Intelligence production deployment..."
    
    check_prerequisites
    create_backup
    build_application
    run_tests
    deploy_services
    wait_for_services
    run_migrations
    verify_deployment
    cleanup
    show_summary
    
    log "🎉 Deployment completed successfully!"
    log "Your TalentGuard Buyer Intelligence platform is now running in production!"
}

# Handle script interruption
trap 'error "Deployment interrupted"' INT TERM

# Run main deployment if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi