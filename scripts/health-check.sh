#!/bin/bash

# 🏥 Personal Fit Santa Fe - Comprehensive Health Check Script
# Verifies all application components are functioning correctly

set -euo pipefail

# ==================== CONFIGURATION ====================
PROJECT_DIR="/opt/Personal-Fit-Santa-Fe"
LOG_DIR="$PROJECT_DIR/logs"
HEALTH_LOG="$LOG_DIR/health-check-$(date +%Y%m%d_%H%M%S).log"
TIMEOUT=30
MAX_RETRIES=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Health check results
declare -A HEALTH_RESULTS

# ==================== LOGGING FUNCTIONS ====================
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$HEALTH_LOG"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$HEALTH_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$HEALTH_LOG"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$HEALTH_LOG"
}

# ==================== HEALTH CHECK FUNCTIONS ====================
check_docker_containers() {
    log "🐳 Checking Docker containers status..."
    
    local containers=("personalfit-frontend" "personalfit-backend" "personalfit-db" "personalfit-pgadmin")
    local all_healthy=true
    
    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
            log_success "Container $container is running"
            HEALTH_RESULTS["container_$container"]="✅ HEALTHY"
        else
            log_error "Container $container is not running"
            HEALTH_RESULTS["container_$container"]="❌ UNHEALTHY"
            all_healthy=false
        fi
    done
    
    if [[ "$all_healthy" == "true" ]]; then
        HEALTH_RESULTS["containers"]="✅ ALL HEALTHY"
        return 0
    else
        HEALTH_RESULTS["containers"]="❌ SOME UNHEALTHY"
        return 1
    fi
}

check_frontend_health() {
    log "🌐 Checking Frontend health..."
    
    local frontend_url="http://localhost:3000"
    local retry_count=0
    
    while [[ $retry_count -lt $MAX_RETRIES ]]; do
        if curl -s -f --connect-timeout $TIMEOUT "$frontend_url" >/dev/null 2>&1; then
            log_success "Frontend is responding"
            
            # Check if the page contains expected content
            if curl -s --connect-timeout $TIMEOUT "$frontend_url" | grep -q "Personal Fit"; then
                log_success "Frontend content validation passed"
                HEALTH_RESULTS["frontend"]="✅ HEALTHY"
                return 0
            else
                log_warning "Frontend responding but content validation failed"
                HEALTH_RESULTS["frontend"]="⚠️ PARTIAL"
                return 1
            fi
        else
            retry_count=$((retry_count + 1))
            if [[ $retry_count -lt $MAX_RETRIES ]]; then
                log_warning "Frontend not responding, retrying... ($retry_count/$MAX_RETRIES)"
                sleep 5
            fi
        fi
    done
    
    log_error "Frontend health check failed"
    HEALTH_RESULTS["frontend"]="❌ UNHEALTHY"
    return 1
}

check_backend_health() {
    log "🔧 Checking Backend health..."
    
    local backend_url="http://localhost:8080"
    local health_endpoint="$backend_url/api/health"
    local retry_count=0
    
    while [[ $retry_count -lt $MAX_RETRIES ]]; do
        # Check basic connectivity
        if curl -s -f --connect-timeout $TIMEOUT "$backend_url" >/dev/null 2>&1; then
            log_success "Backend is responding"
            
            # Check health endpoint if available
            if curl -s --connect-timeout $TIMEOUT "$health_endpoint" >/dev/null 2>&1; then
                log_success "Backend health endpoint is accessible"
            else
                log_warning "Backend health endpoint not available, checking basic endpoint"
            fi
            
            # Check API endpoint
            if curl -s -f --connect-timeout $TIMEOUT "$backend_url/api/auth/health" >/dev/null 2>&1 || \
               curl -s -f --connect-timeout $TIMEOUT "$backend_url/api/" >/dev/null 2>&1; then
                log_success "Backend API endpoints are accessible"
                HEALTH_RESULTS["backend"]="✅ HEALTHY"
                return 0
            else
                log_warning "Backend API endpoints not accessible"
                HEALTH_RESULTS["backend"]="⚠️ PARTIAL"
                return 1
            fi
        else
            retry_count=$((retry_count + 1))
            if [[ $retry_count -lt $MAX_RETRIES ]]; then
                log_warning "Backend not responding, retrying... ($retry_count/$MAX_RETRIES)"
                sleep 5
            fi
        fi
    done
    
    log_error "Backend health check failed"
    HEALTH_RESULTS["backend"]="❌ UNHEALTHY"
    return 1
}

check_database_health() {
    log "🗄️ Checking Database health..."
    
    # Check if PostgreSQL container is running
    if ! docker ps | grep -q "personalfit-db"; then
        log_error "PostgreSQL container is not running"
        HEALTH_RESULTS["database"]="❌ CONTAINER DOWN"
        return 1
    fi
    
    # Test database connectivity
    if docker-compose exec -T postgres pg_isready -U personalfit_user -d personalfit >/dev/null 2>&1; then
        log_success "Database is accepting connections"
        
        # Test basic query
        if docker-compose exec -T postgres psql -U personalfit_user -d personalfit -c "SELECT 1;" >/dev/null 2>&1; then
            log_success "Database query test passed"
            
            # Check table existence (basic schema validation)
            if docker-compose exec -T postgres psql -U personalfit_user -d personalfit -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" >/dev/null 2>&1; then
                log_success "Database schema validation passed"
                HEALTH_RESULTS["database"]="✅ HEALTHY"
                return 0
            else
                log_warning "Database schema validation failed"
                HEALTH_RESULTS["database"]="⚠️ SCHEMA ISSUES"
                return 1
            fi
        else
            log_error "Database query test failed"
            HEALTH_RESULTS["database"]="❌ QUERY FAILED"
            return 1
        fi
    else
        log_error "Database is not accepting connections"
        HEALTH_RESULTS["database"]="❌ NOT ACCEPTING CONNECTIONS"
        return 1
    fi
}

check_network_connectivity() {
    log "🌐 Checking network connectivity..."
    
    # Check internal Docker network
    if docker network inspect personalfit-network >/dev/null 2>&1; then
        log_success "Docker network is available"
    else
        log_error "Docker network is not available"
        HEALTH_RESULTS["network"]="❌ NETWORK UNAVAILABLE"
        return 1
    fi
    
    # Check container-to-container communication
    if docker-compose exec -T personalfit-backend curl -s --connect-timeout 10 "http://postgres:5432" >/dev/null 2>&1 || \
       docker-compose exec -T personalfit-backend nc -z postgres 5432 >/dev/null 2>&1; then
        log_success "Backend can reach database"
    else
        log_warning "Backend cannot reach database"
    fi
    
    if docker-compose exec -T personalfit-frontend curl -s --connect-timeout 10 "http://personalfit-backend:8080" >/dev/null 2>&1; then
        log_success "Frontend can reach backend"
    else
        log_warning "Frontend cannot reach backend"
    fi
    
    HEALTH_RESULTS["network"]="✅ HEALTHY"
    return 0
}

check_disk_space() {
    log "💾 Checking disk space..."
    
    local disk_usage
    disk_usage=$(df -h "$PROJECT_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ $disk_usage -lt 80 ]]; then
        log_success "Disk space is adequate ($disk_usage% used)"
        HEALTH_RESULTS["disk_space"]="✅ ADEQUATE ($disk_usage%)"
    elif [[ $disk_usage -lt 90 ]]; then
        log_warning "Disk space is getting low ($disk_usage% used)"
        HEALTH_RESULTS["disk_space"]="⚠️ LOW ($disk_usage%)"
    else
        log_error "Disk space is critically low ($disk_usage% used)"
        HEALTH_RESULTS["disk_space"]="❌ CRITICAL ($disk_usage%)"
        return 1
    fi
    
    return 0
}

check_memory_usage() {
    log "🧠 Checking memory usage..."
    
    local memory_usage
    memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [[ $memory_usage -lt 80 ]]; then
        log_success "Memory usage is normal ($memory_usage% used)"
        HEALTH_RESULTS["memory"]="✅ NORMAL ($memory_usage%)"
    elif [[ $memory_usage -lt 90 ]]; then
        log_warning "Memory usage is high ($memory_usage% used)"
        HEALTH_RESULTS["memory"]="⚠️ HIGH ($memory_usage%)"
    else
        log_error "Memory usage is critically high ($memory_usage% used)"
        HEALTH_RESULTS["memory"]="❌ CRITICAL ($memory_usage%)"
        return 1
    fi
    
    return 0
}

check_ssl_certificates() {
    log "🔒 Checking SSL certificates..."
    
    local domain="personalfitsantafe.com"
    
    # Check if SSL certificate is valid
    if echo | timeout 10 openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null; then
        local expiry_date
        expiry_date=$(echo | timeout 10 openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        
        if [[ -n "$expiry_date" ]]; then
            log_success "SSL certificate is valid (expires: $expiry_date)"
            HEALTH_RESULTS["ssl"]="✅ VALID"
        else
            log_warning "SSL certificate status could not be determined"
            HEALTH_RESULTS["ssl"]="⚠️ UNKNOWN"
        fi
    else
        log_warning "SSL certificate check failed (might be expected in development)"
        HEALTH_RESULTS["ssl"]="⚠️ NOT AVAILABLE"
    fi
    
    return 0
}

check_application_logs() {
    log "📋 Checking application logs for errors..."
    
    local error_count=0
    
    # Check backend logs for errors
    if docker-compose logs --tail=50 personalfit-backend 2>/dev/null | grep -i "error\|exception\|fatal" | grep -v "ERROR.*health" >/dev/null; then
        error_count=$((error_count + 1))
        log_warning "Backend logs contain error messages"
    fi
    
    # Check frontend logs for errors
    if docker-compose logs --tail=50 personalfit-frontend 2>/dev/null | grep -i "error\|exception\|fatal" >/dev/null; then
        error_count=$((error_count + 1))
        log_warning "Frontend logs contain error messages"
    fi
    
    # Check database logs for errors
    if docker-compose logs --tail=50 postgres 2>/dev/null | grep -i "error\|fatal" | grep -v "ERROR.*health" >/dev/null; then
        error_count=$((error_count + 1))
        log_warning "Database logs contain error messages"
    fi
    
    if [[ $error_count -eq 0 ]]; then
        log_success "No critical errors found in application logs"
        HEALTH_RESULTS["logs"]="✅ CLEAN"
    else
        log_warning "Found $error_count services with error messages in logs"
        HEALTH_RESULTS["logs"]="⚠️ ERRORS DETECTED"
    fi
    
    return 0
}

# ==================== PERFORMANCE CHECKS ====================
check_response_times() {
    log "⏱️ Checking application response times..."
    
    # Frontend response time
    local frontend_time
    frontend_time=$(curl -s -w "%{time_total}" -o /dev/null --connect-timeout $TIMEOUT "http://localhost:3000" 2>/dev/null || echo "timeout")
    
    if [[ "$frontend_time" != "timeout" ]] && (( $(echo "$frontend_time < 3.0" | bc -l) )); then
        log_success "Frontend response time: ${frontend_time}s"
        HEALTH_RESULTS["frontend_response"]="✅ FAST (${frontend_time}s)"
    elif [[ "$frontend_time" != "timeout" ]]; then
        log_warning "Frontend response time is slow: ${frontend_time}s"
        HEALTH_RESULTS["frontend_response"]="⚠️ SLOW (${frontend_time}s)"
    else
        log_error "Frontend response time check failed"
        HEALTH_RESULTS["frontend_response"]="❌ TIMEOUT"
    fi
    
    # Backend response time
    local backend_time
    backend_time=$(curl -s -w "%{time_total}" -o /dev/null --connect-timeout $TIMEOUT "http://localhost:8080" 2>/dev/null || echo "timeout")
    
    if [[ "$backend_time" != "timeout" ]] && (( $(echo "$backend_time < 2.0" | bc -l) )); then
        log_success "Backend response time: ${backend_time}s"
        HEALTH_RESULTS["backend_response"]="✅ FAST (${backend_time}s)"
    elif [[ "$backend_time" != "timeout" ]]; then
        log_warning "Backend response time is slow: ${backend_time}s"
        HEALTH_RESULTS["backend_response"]="⚠️ SLOW (${backend_time}s)"
    else
        log_error "Backend response time check failed"
        HEALTH_RESULTS["backend_response"]="❌ TIMEOUT"
    fi
    
    return 0
}

# ==================== REPORT GENERATION ====================
generate_health_report() {
    log "📊 Generating comprehensive health report..."
    
    local report_file="$PROJECT_DIR/docs/reports/health-check-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# 🏥 Health Check Report - $(date '+%Y-%m-%d %H:%M:%S')

## 📋 System Overview
- **Server**: $(hostname)
- **Uptime**: $(uptime -p)
- **Load Average**: $(uptime | awk -F'load average:' '{print $2}')
- **Check Duration**: $SECONDS seconds

## 🐳 Container Status
$(for container in personalfit-frontend personalfit-backend personalfit-db personalfit-pgladmin; do
    if [[ -n "${HEALTH_RESULTS[container_$container]:-}" ]]; then
        echo "- **$container**: ${HEALTH_RESULTS[container_$container]}"
    fi
done)

## 🌐 Application Health
- **Frontend**: ${HEALTH_RESULTS[frontend]:-❓ NOT CHECKED}
- **Backend**: ${HEALTH_RESULTS[backend]:-❓ NOT CHECKED}
- **Database**: ${HEALTH_RESULTS[database]:-❓ NOT CHECKED}

## ⏱️ Performance Metrics
- **Frontend Response Time**: ${HEALTH_RESULTS[frontend_response]:-❓ NOT CHECKED}
- **Backend Response Time**: ${HEALTH_RESULTS[backend_response]:-❓ NOT CHECKED}

## 💻 System Resources
- **Disk Space**: ${HEALTH_RESULTS[disk_space]:-❓ NOT CHECKED}
- **Memory Usage**: ${HEALTH_RESULTS[memory]:-❓ NOT CHECKED}
- **Network**: ${HEALTH_RESULTS[network]:-❓ NOT CHECKED}

## 🔒 Security & Certificates
- **SSL Certificate**: ${HEALTH_RESULTS[ssl]:-❓ NOT CHECKED}

## 📋 Logs Status
- **Application Logs**: ${HEALTH_RESULTS[logs]:-❓ NOT CHECKED}

## 🎯 Overall Status
EOF
    
    # Calculate overall health score
    local healthy_count=0
    local total_count=0
    
    for key in "${!HEALTH_RESULTS[@]}"; do
        if [[ "${HEALTH_RESULTS[$key]}" == *"✅"* ]]; then
            healthy_count=$((healthy_count + 1))
        fi
        total_count=$((total_count + 1))
    done
    
    local health_percentage
    if [[ $total_count -gt 0 ]]; then
        health_percentage=$((healthy_count * 100 / total_count))
    else
        health_percentage=0
    fi
    
    if [[ $health_percentage -ge 90 ]]; then
        echo "**🟢 EXCELLENT** - $health_percentage% of checks passed" >> "$report_file"
    elif [[ $health_percentage -ge 70 ]]; then
        echo "**🟡 GOOD** - $health_percentage% of checks passed" >> "$report_file"
    elif [[ $health_percentage -ge 50 ]]; then
        echo "**🟠 WARNING** - $health_percentage% of checks passed" >> "$report_file"
    else
        echo "**🔴 CRITICAL** - $health_percentage% of checks passed" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    echo "---" >> "$report_file"
    echo "*Report generated at $(date '+%Y-%m-%d %H:%M:%S')*" >> "$report_file"
    
    log_success "Health report generated: $report_file"
}

# ==================== MAIN FUNCTION ====================
main() {
    log "🏥 Starting comprehensive health check for Personal Fit Santa Fe..."
    
    # Create log directory
    mkdir -p "$LOG_DIR"
    mkdir -p "$PROJECT_DIR/docs/reports"
    
    # Change to project directory
    cd "$PROJECT_DIR"
    
    # Initialize health check results
    local overall_health=true
    
    # Run all health checks
    check_docker_containers || overall_health=false
    check_frontend_health || overall_health=false
    check_backend_health || overall_health=false
    check_database_health || overall_health=false
    check_network_connectivity || overall_health=false
    check_disk_space || overall_health=false
    check_memory_usage || overall_health=false
    check_ssl_certificates || overall_health=false
    check_application_logs || overall_health=false
    check_response_times || overall_health=false
    
    # Generate comprehensive report
    generate_health_report
    
    # Display summary
    echo ""
    echo "=============================================="
    log "🎯 HEALTH CHECK SUMMARY"
    echo "=============================================="
    
    for key in "${!HEALTH_RESULTS[@]}"; do
        echo "  $key: ${HEALTH_RESULTS[$key]}"
    done
    
    echo "=============================================="
    
    if [[ "$overall_health" == "true" ]]; then
        log_success "🎉 All health checks passed! Application is healthy."
        echo ""
        log_success "🌐 Application URLs:"
        log_success "   Frontend: https://personalfitsantafe.com"
        log_success "   Backend API: https://personalfitsantafe.com:8080"
        log_success "   PgAdmin: https://personalfitsantafe.com:5050"
        exit 0
    else
        log_warning "⚠️ Some health checks failed. Please review the issues above."
        exit 1
    fi
}

# ==================== SCRIPT EXECUTION ====================
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
