#!/bin/bash

# TalentGuard Buyer Intelligence - Production Testing Script
# This script performs comprehensive end-to-end testing of all platform features

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL="http://localhost:3000"
TEST_USER_EMAIL="test@talentguard.com"
TEST_USER_PASSWORD="TestPassword123!"
LOG_FILE="./logs/production-test-$(date +%Y%m%d-%H%M%S).log"

# Create logs directory if it doesn't exist
mkdir -p ./logs

# Function to log messages
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    info "Running test: $test_name"
    
    if eval "$test_command"; then
        log "✓ PASS: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        error "✗ FAIL: $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to check HTTP response
check_http() {
    local url="$1"
    local expected_status="$2"
    local description="$3"
    
    local response=$(curl -s -w "%{http_code}" -o /dev/null "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        return 0
    else
        error "$description - Expected: $expected_status, Got: $response"
        return 1
    fi
}

# Function to check JSON response
check_json_response() {
    local url="$1"
    local json_path="$2"
    local expected_value="$3"
    local description="$4"
    
    local response=$(curl -s "$url" 2>/dev/null)
    local actual_value=$(echo "$response" | jq -r "$json_path" 2>/dev/null || echo "null")
    
    if [ "$actual_value" = "$expected_value" ]; then
        return 0
    else
        error "$description - Expected: $expected_value, Got: $actual_value"
        return 1
    fi
}

# Test 1: Service Health Checks
test_service_health() {
    log "Testing service health checks..."
    
    # Test application health endpoint
    run_test "Application Health Endpoint" \
        "check_http '$BASE_URL/api/health' '200' 'Health endpoint'" 
    
    # Test health response structure
    run_test "Health Response Structure" \
        "check_json_response '$BASE_URL/api/health' '.status' 'healthy' 'Health status'"
    
    # Test metrics endpoint
    run_test "Metrics Endpoint" \
        "check_http '$BASE_URL/api/metrics' '200' 'Metrics endpoint'"
}

# Test 2: Authentication System
test_authentication() {
    log "Testing authentication system..."
    
    # Test auth status endpoint (should return 401 without token)
    run_test "Auth Status Unauthorized" \
        "check_http '$BASE_URL/api/auth/status' '401' 'Auth status without token'"
    
    # Test login endpoint exists
    run_test "Login Endpoint Exists" \
        "check_http '$BASE_URL/api/auth/login' '400' 'Login endpoint (400 for missing body)'"
    
    # Test registration endpoint exists
    run_test "Registration Endpoint Exists" \
        "check_http '$BASE_URL/api/auth/register' '400' 'Registration endpoint'"
}

# Test 3: Database Connectivity
test_database_connectivity() {
    log "Testing database connectivity..."
    
    # Test if we can connect to the database via the app
    local health_response=$(curl -s "$BASE_URL/api/health" 2>/dev/null || echo "{}")
    local db_status=$(echo "$health_response" | jq -r '.services.database.status' 2>/dev/null || echo "unknown")
    
    run_test "Database Service Health" \
        "[ '$db_status' = 'healthy' ]"
    
    # Test Redis connectivity
    local redis_status=$(echo "$health_response" | jq -r '.services.redis.status' 2>/dev/null || echo "unknown")
    
    run_test "Redis Service Health" \
        "[ '$redis_status' = 'healthy' ]"
}

# Test 4: API Endpoints
test_api_endpoints() {
    log "Testing API endpoints..."
    
    # Test various API endpoints exist (should return 401/400 but not 404)
    local endpoints=(
        "/api/connections"
        "/api/posts"
        "/api/intelligence"
        "/api/user/tone-profiles"
        "/api/companies"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL$endpoint" 2>/dev/null || echo "000")
        
        if [ "$response" != "404" ] && [ "$response" != "000" ]; then
            run_test "API Endpoint $endpoint exists" "true"
        else
            run_test "API Endpoint $endpoint exists" "false"
        fi
    done
}

# Test 5: Static Assets and Frontend
test_frontend() {
    log "Testing frontend application..."
    
    # Test main page loads
    run_test "Home Page Loads" \
        "check_http '$BASE_URL' '200' 'Home page'"
    
    # Test dashboard exists (should redirect to login or load)
    local dashboard_response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/dashboard" 2>/dev/null || echo "000")
    
    if [ "$dashboard_response" = "200" ] || [ "$dashboard_response" = "302" ] || [ "$dashboard_response" = "307" ]; then
        run_test "Dashboard Route Accessible" "true"
    else
        run_test "Dashboard Route Accessible" "false"
    fi
    
    # Test settings page
    local settings_response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/dashboard/settings" 2>/dev/null || echo "000")
    
    if [ "$settings_response" = "200" ] || [ "$settings_response" = "302" ] || [ "$settings_response" = "307" ]; then
        run_test "Settings Page Accessible" "true"
    else
        run_test "Settings Page Accessible" "false"
    fi
}

# Test 6: External API Configurations
test_external_apis() {
    log "Testing external API configurations..."
    
    # Check if API keys are configured (via health endpoint)
    local health_response=$(curl -s "$BASE_URL/api/health" 2>/dev/null || echo "{}")
    local external_apis_status=$(echo "$health_response" | jq -r '.services.external_apis.status' 2>/dev/null || echo "unknown")
    
    run_test "External APIs Configuration" \
        "[ '$external_apis_status' = 'healthy' ]"
    
    # Test if environment variables are properly set
    if [ -f ".env.production" ]; then
        local openai_key=$(grep "OPENAI_API_KEY=" .env.production | cut -d'=' -f2)
        local perplexity_key=$(grep "PERPLEXITY_API_KEY=" .env.production | cut -d'=' -f2)
        local rapidapi_key=$(grep "RAPIDAPI_KEY=" .env.production | cut -d'=' -f2)
        
        if [ -n "$openai_key" ] && [ "$openai_key" != "your_openai_key_here" ]; then
            run_test "OpenAI API Key Configured" "true"
        else
            run_test "OpenAI API Key Configured" "false"
        fi
        
        if [ -n "$perplexity_key" ] && [ "$perplexity_key" != "pplx-your_perplexity_key_here" ]; then
            run_test "Perplexity API Key Configured" "true"
        else
            run_test "Perplexity API Key Configured" "false"
        fi
        
        if [ -n "$rapidapi_key" ] && [ "$rapidapi_key" != "your_rapidapi_key_here" ]; then
            run_test "RapidAPI Key Configured" "true"
        else
            run_test "RapidAPI Key Configured" "false"
        fi
    else
        warning "Environment file not found for API key testing"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# Test 7: Security Headers
test_security() {
    log "Testing security configuration..."
    
    # Test security headers
    local headers_response=$(curl -s -I "$BASE_URL" 2>/dev/null)
    
    # Check for HTTPS redirect or security headers
    if echo "$headers_response" | grep -qi "strict-transport-security\|x-frame-options\|x-content-type-options"; then
        run_test "Security Headers Present" "true"
    else
        run_test "Security Headers Present" "false"
    fi
    
    # Test CORS configuration
    local cors_response=$(curl -s -H "Origin: https://example.com" -I "$BASE_URL/api/health" 2>/dev/null)
    
    if echo "$cors_response" | grep -qi "access-control\|cors"; then
        run_test "CORS Headers Configured" "true"
    else
        warning "CORS headers not detected (may be configured in middleware)"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# Test 8: Performance
test_performance() {
    log "Testing performance metrics..."
    
    # Test response time for main page
    local start_time=$(date +%s%N)
    curl -s "$BASE_URL" > /dev/null 2>&1
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds
    
    if [ $response_time -lt 3000 ]; then  # Less than 3 seconds
        run_test "Home Page Response Time (<3s)" "true"
        info "Home page response time: ${response_time}ms"
    else
        run_test "Home Page Response Time (<3s)" "false"
        warning "Home page response time: ${response_time}ms (slow)"
    fi
    
    # Test health endpoint response time
    start_time=$(date +%s%N)
    curl -s "$BASE_URL/api/health" > /dev/null 2>&1
    end_time=$(date +%s%N)
    response_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ $response_time -lt 1000 ]; then  # Less than 1 second
        run_test "Health Endpoint Response Time (<1s)" "true"
        info "Health endpoint response time: ${response_time}ms"
    else
        run_test "Health Endpoint Response Time (<1s)" "false"
        warning "Health endpoint response time: ${response_time}ms (slow)"
    fi
}

# Test 9: Container Health
test_containers() {
    log "Testing Docker container health..."
    
    # Check if all required containers are running
    local containers=(
        "talentguard-app-prod"
        "talentguard-redis-prod"
        "talentguard-postgres-prod"
        "talentguard-worker-prod"
    )
    
    for container in "${containers[@]}"; do
        if docker ps | grep -q "$container"; then
            run_test "Container $container is running" "true"
        else
            run_test "Container $container is running" "false"
        fi
    done
    
    # Check container health status
    local unhealthy_containers=$(docker ps --filter "health=unhealthy" --format "table {{.Names}}" | grep -v NAMES || true)
    
    if [ -z "$unhealthy_containers" ]; then
        run_test "All containers are healthy" "true"
    else
        run_test "All containers are healthy" "false"
        error "Unhealthy containers: $unhealthy_containers"
    fi
}

# Test 10: Monitoring Stack
test_monitoring() {
    log "Testing monitoring stack..."
    
    # Test Prometheus
    run_test "Prometheus Accessible" \
        "check_http 'http://localhost:9090' '200' 'Prometheus'"
    
    # Test Grafana
    run_test "Grafana Accessible" \
        "check_http 'http://localhost:3001' '200' 'Grafana'"
    
    # Test metrics collection
    local metrics_response=$(curl -s "$BASE_URL/api/metrics" 2>/dev/null || echo "")
    
    if echo "$metrics_response" | grep -q "talentguard_"; then
        run_test "Custom Metrics Available" "true"
    else
        run_test "Custom Metrics Available" "false"
    fi
}

# Function to generate test report
generate_report() {
    log "Generating test report..."
    
    local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    
    echo ""
    echo "=============================================="
    echo "   TalentGuard Production Test Results"
    echo "=============================================="
    echo ""
    echo "Total Tests:    $TOTAL_TESTS"
    echo "Passed:         $PASSED_TESTS"
    echo "Failed:         $FAILED_TESTS"
    echo "Warnings:       $WARNINGS"
    echo "Success Rate:   ${success_rate}%"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        log "🎉 All tests passed! Your TalentGuard platform is ready for production."
    elif [ $success_rate -ge 80 ]; then
        warning "Most tests passed ($success_rate%), but some issues need attention."
    else
        error "Multiple test failures detected ($success_rate% success rate). Review issues before production deployment."
    fi
    
    echo ""
    echo "Detailed log: $LOG_FILE"
    echo "=============================================="
}

# Main testing function
main() {
    log "Starting TalentGuard Production Testing Suite..."
    log "Base URL: $BASE_URL"
    
    # Prerequisites check
    if ! command -v curl &> /dev/null; then
        error "curl is not installed. Please install curl first."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        error "jq is not installed. Please install jq first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        error "docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Wait for application to be ready
    info "Waiting for application to be ready..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s "$BASE_URL/api/health" > /dev/null 2>&1; then
            log "Application is ready ✓"
            break
        fi
        
        attempt=$((attempt + 1))
        info "Waiting for application... ($attempt/$max_attempts)"
        sleep 10
    done
    
    if [ $attempt -eq $max_attempts ]; then
        error "Application failed to become ready within expected time"
        exit 1
    fi
    
    # Run test suites
    test_service_health
    test_authentication
    test_database_connectivity
    test_api_endpoints
    test_frontend
    test_external_apis
    test_security
    test_performance
    test_containers
    test_monitoring
    
    # Generate final report
    generate_report
    
    # Exit with appropriate code
    if [ $FAILED_TESTS -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Handle script interruption
trap 'error "Testing interrupted"' INT TERM

# Run main testing if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi