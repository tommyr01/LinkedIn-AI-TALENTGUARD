#!/bin/bash

# TalentGuard Buyer Intelligence - Monitoring Setup Script
# This script configures Grafana dashboards and monitoring alerts

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Configuration
GRAFANA_URL="http://localhost:3001"
GRAFANA_USER="admin"
GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-admin}"

# Wait for Grafana to be available
wait_for_grafana() {
    log "Waiting for Grafana to be available..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$GRAFANA_URL/api/health" > /dev/null 2>&1; then
            log "Grafana is available ✓"
            break
        fi
        
        attempt=$((attempt + 1))
        echo "Waiting for Grafana... ($attempt/$max_attempts)"
        sleep 10
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo "ERROR: Grafana failed to become available"
        exit 1
    fi
}

# Configure Grafana data source
setup_prometheus_datasource() {
    log "Setting up Prometheus data source in Grafana..."
    
    curl -X POST \
        -H "Content-Type: application/json" \
        -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
        -d '{
            "name": "Prometheus",
            "type": "prometheus",
            "url": "http://prometheus:9090",
            "access": "proxy",
            "isDefault": true
        }' \
        "$GRAFANA_URL/api/datasources" || warning "Data source may already exist"
    
    log "Prometheus data source configured ✓"
}

# Import TalentGuard dashboard
import_dashboards() {
    log "Importing TalentGuard monitoring dashboard..."
    
    # Create the dashboard JSON
    cat > /tmp/talentguard-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "TalentGuard Buyer Intelligence",
    "tags": ["talentguard"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Application Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"talentguard-app\"}",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {
                  "color": "red",
                  "value": 0
                },
                {
                  "color": "green",
                  "value": 1
                }
              ]
            }
          }
        },
        "gridPos": {
          "h": 4,
          "w": 6,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Response Time (95th percentile)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=\"talentguard-app\"}[5m]))",
            "refId": "A"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 6,
          "y": 0
        }
      },
      {
        "id": 3,
        "title": "Total Connections",
        "type": "stat",
        "targets": [
          {
            "expr": "talentguard_total_connections",
            "refId": "A"
          }
        ],
        "gridPos": {
          "h": 4,
          "w": 6,
          "x": 18,
          "y": 0
        }
      },
      {
        "id": 4,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"talentguard-app\",status=~\"5..\"}[5m])",
            "refId": "A"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 4
        }
      },
      {
        "id": 5,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "nodejs_memory_usage_bytes{type=\"heapUsed\"}",
            "refId": "A"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 4
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "timepicker": {},
    "refresh": "30s"
  },
  "overwrite": false
}
EOF
    
    # Import the dashboard
    curl -X POST \
        -H "Content-Type: application/json" \
        -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
        -d @/tmp/talentguard-dashboard.json \
        "$GRAFANA_URL/api/dashboards/db" || warning "Dashboard import may have failed"
    
    rm /tmp/talentguard-dashboard.json
    log "Dashboard imported successfully ✓"
}

# Setup notification channels
setup_notifications() {
    log "Setting up notification channels..."
    
    # Email notification channel (example)
    curl -X POST \
        -H "Content-Type: application/json" \
        -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
        -d '{
            "name": "TalentGuard Alerts",
            "type": "email",
            "settings": {
                "addresses": "admin@talentguard.com"
            }
        }' \
        "$GRAFANA_URL/api/alert-notifications" || warning "Notification channel may already exist"
    
    log "Notification channels configured ✓"
}

# Main setup function
main() {
    log "Starting TalentGuard monitoring setup..."
    
    wait_for_grafana
    setup_prometheus_datasource
    import_dashboards
    setup_notifications
    
    log "🎉 Monitoring setup completed successfully!"
    log "Access Grafana at: $GRAFANA_URL"
    log "Username: $GRAFANA_USER"
    log "Password: $GRAFANA_PASSWORD"
}

# Run main setup
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi