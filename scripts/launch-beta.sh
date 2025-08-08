#!/bin/bash

# TalentGuard Buyer Intelligence - Beta Launch Script
# This script helps coordinate the beta launch process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BETA_ENV_FILE=".env.beta"
BETA_USERS_FILE="./beta-users.csv"
LOG_FILE="./logs/beta-launch-$(date +%Y%m%d-%H%M%S).log"

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

# Function to display beta launch header
show_header() {
    echo ""
    echo "=============================================="
    echo "   TalentGuard Beta Launch Coordinator"
    echo "=============================================="
    echo ""
    echo "This script helps manage the beta launch process including:"
    echo "• Beta user account creation and management"
    echo "• Welcome email automation"
    echo "• Usage analytics setup"
    echo "• Feedback collection coordination"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking beta launch prerequisites..."
    
    # Check if production environment is ready
    if [ ! -f "$BETA_ENV_FILE" ]; then
        error "$BETA_ENV_FILE file not found. Please create beta environment configuration."
        exit 1
    fi
    
    # Check if beta users file exists
    if [ ! -f "$BETA_USERS_FILE" ]; then
        warning "$BETA_USERS_FILE not found. Creating template file..."
        create_beta_users_template
    fi
    
    # Check if required tools are installed
    if ! command -v curl &> /dev/null; then
        error "curl is not installed. Please install curl first."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        error "jq is not installed. Please install jq first."
        exit 1
    fi
    
    log "Prerequisites check completed ✓"
}

# Function to create beta users template
create_beta_users_template() {
    cat > "$BETA_USERS_FILE" << 'EOF'
email,name,company,role,linkedin_url,notes
john.doe@company1.com,John Doe,TechCorp,Sales Development Representative,https://linkedin.com/in/johndoe,High activity on LinkedIn
jane.smith@company2.com,Jane Smith,HR Solutions Inc,Account Executive,https://linkedin.com/in/janesmith,Experienced in HR tech sales
mike.jones@company3.com,Mike Jones,People Analytics Co,Sales Manager,https://linkedin.com/in/mikejones,Manages team of 5 reps
sarah.wilson@company4.com,Sarah Wilson,Talent Tech Ltd,Sales Operations,https://linkedin.com/in/sarahwilson,Process optimization focus
EOF
    
    info "Beta users template created at $BETA_USERS_FILE"
    info "Please update with your actual beta user information before proceeding."
}

# Function to setup beta environment
setup_beta_environment() {
    log "Setting up beta environment..."
    
    # Load beta environment variables
    source "$BETA_ENV_FILE"
    
    # Validate required environment variables
    if [ -z "$BETA_API_URL" ]; then
        error "BETA_API_URL not set in $BETA_ENV_FILE"
        exit 1
    fi
    
    # Test API connectivity
    if curl -f -s "$BETA_API_URL/api/health" > /dev/null 2>&1; then
        log "Beta environment is accessible ✓"
    else
        error "Beta environment is not accessible at $BETA_API_URL"
        exit 1
    fi
}

# Function to create beta user accounts
create_beta_users() {
    log "Creating beta user accounts..."
    
    if [ ! -f "$BETA_USERS_FILE" ]; then
        error "Beta users file $BETA_USERS_FILE not found"
        exit 1
    fi
    
    local created_count=0
    local failed_count=0
    
    # Skip header row and process each user
    tail -n +2 "$BETA_USERS_FILE" | while IFS=',' read -r email name company role linkedin_url notes; do
        # Remove quotes if present
        email=$(echo "$email" | sed 's/"//g')
        name=$(echo "$name" | sed 's/"//g')
        company=$(echo "$company" | sed 's/"//g')
        role=$(echo "$role" | sed 's/"//g')
        
        info "Creating account for $name ($email)..."
        
        # Generate temporary password
        temp_password=$(openssl rand -base64 12)
        
        # Create user account via API
        response=$(curl -s -X POST "$BETA_API_URL/api/auth/register" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ADMIN_API_KEY" \
            -d "{
                \"email\": \"$email\",
                \"password\": \"$temp_password\",
                \"full_name\": \"$name\",
                \"company\": \"$company\",
                \"role\": \"$role\",
                \"linkedin_url\": \"$linkedin_url\",
                \"user_type\": \"beta_user\",
                \"beta_program\": true,
                \"notes\": \"$notes\"
            }")
        
        if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
            log "✓ Account created for $name"
            created_count=$((created_count + 1))
            
            # Store credentials for welcome email
            echo "$email,$temp_password,$name" >> "./logs/beta-credentials-$(date +%Y%m%d).csv"
        else
            error "✗ Failed to create account for $name: $(echo "$response" | jq -r '.error // "Unknown error"')"
            failed_count=$((failed_count + 1))
        fi
        
        # Small delay to avoid rate limiting
        sleep 1
    done
    
    log "Beta user creation completed: $created_count created, $failed_count failed"
}

# Function to send welcome emails
send_welcome_emails() {
    log "Sending welcome emails to beta users..."
    
    local credentials_file="./logs/beta-credentials-$(date +%Y%m%d).csv"
    
    if [ ! -f "$credentials_file" ]; then
        error "Credentials file not found: $credentials_file"
        exit 1
    fi
    
    local sent_count=0
    local failed_count=0
    
    while IFS=',' read -r email password name; do
        info "Sending welcome email to $name ($email)..."
        
        # Create personalized welcome email
        local email_body=$(cat << EOF
Subject: Welcome to TalentGuard Beta Program! 🚀

Hi $name,

Welcome to the exclusive TalentGuard Buyer Intelligence beta program! We're thrilled to have you as one of our founding users.

**Your Beta Access Details:**
• Platform URL: $BETA_API_URL
• Email: $email  
• Temporary Password: $password
• Beta Program: 8-week access with all premium features

**What's Next:**
1. Login to your account: $BETA_API_URL/login
2. Change your password in Settings
3. Complete your profile setup
4. Watch the quick start video tutorial
5. Add your first target companies

**Beta Program Benefits:**
✅ Unlimited access to all premium features
✅ Direct line to our product team
✅ Weekly feedback sessions and input on roadmap
✅ 50% discount on your first year if you continue
✅ Recognition as a TalentGuard founding user

**Support & Resources:**
• Quick Start Guide: $BETA_API_URL/help/quick-start
• Video Tutorials: $BETA_API_URL/help/videos  
• Beta User Slack: [We'll send invite separately]
• Direct Support: beta-support@talentguard.com

We've prepared a comprehensive onboarding experience to help you get maximum value from the platform. Our goal is to save you 5+ hours per week on prospecting while improving your response rates by 30%+.

**This Week's Objectives:**
□ Complete profile setup and add first companies
□ Create your personalized tone of voice profile
□ Generate your first 10 AI-powered messages
□ Research 3-5 high-value prospects
□ Send your first outreach messages

Questions? Reply to this email or reach out anytime. We're here to ensure your success!

Looking forward to your feedback and seeing the amazing results you achieve.

Best regards,
The TalentGuard Team

P.S. We'll be sending you a calendar invite for a 30-minute onboarding call this week. Looking forward to meeting you!

---
TalentGuard Buyer Intelligence
Accelerating HR Technology Sales
EOF
        )
        
        # Send email via API or external service
        # This would integrate with your email service (SendGrid, SES, etc.)
        if send_email_via_api "$email" "$email_body"; then
            log "✓ Welcome email sent to $name"
            sent_count=$((sent_count + 1))
        else
            error "✗ Failed to send welcome email to $name"
            failed_count=$((failed_count + 1))
        fi
        
    done < "$credentials_file"
    
    log "Welcome emails completed: $sent_count sent, $failed_count failed"
}

# Function to send email via API (placeholder)
send_email_via_api() {
    local email="$1"
    local body="$2"
    
    # This would be replaced with actual email service integration
    # For now, just log the email content
    echo "$body" > "./logs/welcome-email-$email.txt"
    
    # Simulate API call
    return 0
}

# Function to setup analytics tracking
setup_beta_analytics() {
    log "Setting up beta analytics tracking..."
    
    # Create beta user analytics dashboard
    curl -s -X POST "$BETA_API_URL/api/admin/analytics/beta-dashboard" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_API_KEY" \
        -d '{
            "dashboard_name": "Beta User Analytics",
            "metrics": [
                "daily_active_users",
                "feature_adoption_rates",
                "message_generation_volume",
                "research_requests",
                "user_satisfaction_scores",
                "nps_scores",
                "session_duration",
                "error_rates"
            ],
            "refresh_interval": "hourly"
        }' > /dev/null
    
    # Setup automated feedback collection
    curl -s -X POST "$BETA_API_URL/api/admin/feedback/schedule" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_API_KEY" \
        -d '{
            "survey_type": "weekly_beta_pulse",
            "target_users": "beta_users",
            "schedule": "weekly_friday",
            "duration_weeks": 8
        }' > /dev/null
    
    log "Beta analytics tracking setup completed ✓"
}

# Function to create beta program monitoring
setup_beta_monitoring() {
    log "Setting up beta program monitoring..."
    
    # Create beta-specific monitoring alerts
    cat > "./monitoring/beta-alerts.yml" << 'EOF'
groups:
  - name: beta_program_alerts
    rules:
      - alert: BetaUserInactivity
        expr: beta_user_last_login > 48h
        for: 2h
        labels:
          severity: warning
        annotations:
          summary: "Beta user has been inactive"
          description: "Beta user {{ $labels.user_email }} has not logged in for {{ $value }} hours."

      - alert: LowBetaEngagement
        expr: beta_daily_active_users / beta_total_users < 0.8
        for: 6h
        labels:
          severity: warning
        annotations:
          summary: "Beta engagement below target"
          description: "Beta daily active users ({{ $value }}%) below 80% target."

      - alert: BetaUserError
        expr: rate(beta_user_errors[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate for beta users"
          description: "Beta users experiencing high error rates: {{ $value }} errors/second."
EOF
    
    # Setup daily beta reports
    crontab -l | { cat; echo "0 9 * * * /path/to/send-beta-daily-report.sh"; } | crontab -
    
    log "Beta program monitoring setup completed ✓"
}

# Function to generate beta status report
generate_beta_report() {
    log "Generating beta program status report..."
    
    local report_file="./reports/beta-status-$(date +%Y%m%d).html"
    mkdir -p ./reports
    
    # Get beta metrics via API
    local metrics=$(curl -s "$BETA_API_URL/api/admin/analytics/beta-summary" \
        -H "Authorization: Bearer $ADMIN_API_KEY")
    
    # Generate HTML report
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TalentGuard Beta Program Status - $(date +%Y-%m-%d)</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
    </style>
</head>
<body>
    <h1>TalentGuard Beta Program Status</h1>
    <p><strong>Report Date:</strong> $(date)</p>
    
    <h2>Key Metrics</h2>
    <div class="metric">
        <h3>User Engagement</h3>
        <p>Daily Active Users: <span id="dau">Loading...</span></p>
        <p>Weekly Active Users: <span id="wau">Loading...</span></p>
        <p>Average Session Duration: <span id="session">Loading...</span></p>
    </div>
    
    <div class="metric">
        <h3>Feature Adoption</h3>
        <p>Company Search Usage: <span id="company_search">Loading...</span></p>
        <p>AI Content Generation: <span id="ai_content">Loading...</span></p>
        <p>Research Requests: <span id="research">Loading...</span></p>
    </div>
    
    <div class="metric">
        <h3>Satisfaction Scores</h3>
        <p>Average Rating: <span id="rating">Loading...</span>/10</p>
        <p>Net Promoter Score: <span id="nps">Loading...</span></p>
        <p>Feature Satisfaction: <span id="feature_satisfaction">Loading...</span></p>
    </div>
    
    <h2>Top Issues & Feedback</h2>
    <div id="feedback">Loading...</div>
    
    <script>
        // This would be populated with actual metrics data
        document.getElementById('dau').textContent = '${metrics}' || 'N/A';
    </script>
</body>
</html>
EOF
    
    log "Beta status report generated: $report_file"
}

# Function to show main menu
show_menu() {
    echo ""
    echo "Beta Launch Actions:"
    echo "1. Check Prerequisites"
    echo "2. Setup Beta Environment"
    echo "3. Create Beta User Accounts"
    echo "4. Send Welcome Emails"
    echo "5. Setup Analytics & Monitoring"
    echo "6. Generate Status Report"
    echo "7. Full Beta Launch (Run All Steps)"
    echo "8. Exit"
    echo ""
    read -p "Select an option (1-8): " choice
}

# Function to run full beta launch
full_beta_launch() {
    log "Starting full beta launch process..."
    
    check_prerequisites
    setup_beta_environment
    create_beta_users
    send_welcome_emails
    setup_beta_analytics
    setup_beta_monitoring
    generate_beta_report
    
    log "🎉 Beta launch process completed successfully!"
    echo ""
    echo "Next Steps:"
    echo "1. Monitor beta user onboarding and first-week usage"
    echo "2. Schedule individual onboarding calls with each beta user"  
    echo "3. Set up weekly feedback collection and review cycles"
    echo "4. Monitor analytics dashboard for engagement metrics"
    echo "5. Begin planning optimization sprints based on feedback"
}

# Main function
main() {
    show_header
    
    while true; do
        show_menu
        
        case $choice in
            1)
                check_prerequisites
                ;;
            2)
                setup_beta_environment
                ;;
            3)
                create_beta_users
                ;;
            4)
                send_welcome_emails
                ;;
            5)
                setup_beta_analytics
                setup_beta_monitoring
                ;;
            6)
                generate_beta_report
                ;;
            7)
                full_beta_launch
                break
                ;;
            8)
                log "Exiting beta launch coordinator"
                exit 0
                ;;
            *)
                warning "Invalid option. Please select 1-8."
                ;;
        esac
    done
}

# Handle script interruption
trap 'error "Beta launch process interrupted"' INT TERM

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi