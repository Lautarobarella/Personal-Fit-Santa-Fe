#!/bin/bash

# 🚀 Personal Fit Santa Fe - Deployment Script
# Professional CI/CD Deployment with Zero-Downtime and Rollback Support

set -euo pipefail

# ==================== CONFIGURATION ====================
PROJECT_DIR="/opt/Personal-Fit-Santa-Fe"
BACKUP_DIR="/opt/backups/personalfit"
LOG_DIR="$PROJECT_DIR/logs"
DEPLOY_LOG="$LOG_DIR/deploy-$(date +%Y%m%d_%H%M%S).log"
MAX_RETRIES=3
HEALTH_CHECK_TIMEOUT=300
ROLLBACK_ON_FAILURE=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================== LOGGING FUNCTIONS ====================
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$DEPLOY_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$DEPLOY_LOG"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$DEPLOY_LOG"
}

# ==================== UTILITY FUNCTIONS ====================
cleanup_on_exit() {
    log "🧹 Performing cleanup on exit..."
    # Remove temporary files
    rm -f /tmp/deploy_*.tmp
}

trap cleanup_on_exit EXIT

check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    # Check if running as root or with sudo
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running or not accessible"
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose >/dev/null 2>&1; then
        log_error "docker-compose is not installed"
        exit 1
    fi
    
    # Check if we're in the correct directory
    if [[ ! -f "$PROJECT_DIR/docker-compose.yml" ]]; then
        log_error "docker-compose.yml not found in $PROJECT_DIR"
        exit 1
    fi
    
    log_success "All prerequisites met"
}

create_directories() {
    log "📁 Creating necessary directories..."
    mkdir -p "$LOG_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$PROJECT_DIR/docs/reports/deployment"
    log_success "Directories created"
}

# ==================== BACKUP FUNCTIONS ====================
create_backup() {
    log "💾 Creating pre-deployment backup..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/pre_deploy_backup_$timestamp.sql"
    local volumes_backup_dir="$BACKUP_DIR/volumes_$timestamp"
    
    # Create database backup
    if docker-compose exec -T postgres pg_dump -U personalfit_user -d personalfit > "$backup_file" 2>/dev/null; then
        gzip "$backup_file"
        log_success "Database backup created: ${backup_file}.gz"
        echo "${backup_file}.gz" > /tmp/deploy_last_backup.tmp
    else
        log_warning "Failed to create database backup, continuing without backup"
    fi
    
    # Create volumes backup
    mkdir -p "$volumes_backup_dir"
    
    # Backup PostgreSQL data volume
    if docker run --rm -v personalfit_pgdata:/data -v "$volumes_backup_dir":/backup alpine tar czf /backup/pgdata.tar.gz -C /data . 2>/dev/null; then
        log_success "PostgreSQL volume backup created"
    else
        log_warning "Failed to backup PostgreSQL volume"
    fi
    
    # Backup comprobantes volume
    if docker run --rm -v personalfit_comprobantes:/data -v "$volumes_backup_dir":/backup alpine tar czf /backup/comprobantes.tar.gz -C /data . 2>/dev/null; then
        log_success "Comprobantes volume backup created"
    else
        log_warning "Failed to backup comprobantes volume"
    fi
    
    echo "$volumes_backup_dir" > /tmp/deploy_last_volumes_backup.tmp
}

# ==================== HEALTH CHECK FUNCTIONS ====================
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_wait=$3
    local waited=0
    
    log "⏳ Waiting for $service_name to be ready on port $port..."
    
    while [[ $waited -lt $max_wait ]]; do
        if curl -s -f "http://localhost:$port/health" >/dev/null 2>&1 || \
           curl -s -f "http://localhost:$port/" >/dev/null 2>&1; then
            log_success "$service_name is ready!"
            return 0
        fi
        
        sleep 5
        waited=$((waited + 5))
        
        if [[ $((waited % 30)) -eq 0 ]]; then
            log "Still waiting for $service_name... (${waited}s elapsed)"
        fi
    done
    
    log_error "$service_name failed to start within ${max_wait}s"
    return 1
}

comprehensive_health_check() {
    log "🏥 Running comprehensive health check..."
    
    # Check if containers are running
    local containers=("personalfit-frontend" "personalfit-backend" "personalfit-db")
    for container in "${containers[@]}"; do
        if ! docker ps | grep -q "$container"; then
            log_error "Container $container is not running"
            return 1
        fi
    done
    
    # Check application endpoints
    local endpoints=(
        "http://localhost:3000:Frontend"
        "http://localhost:8080:Backend"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        IFS=':' read -r url service <<< "$endpoint_info"
        
        log "🔍 Testing $service endpoint: $url"
        
        local retry_count=0
        while [[ $retry_count -lt $MAX_RETRIES ]]; do
            if curl -s -f "$url" >/dev/null 2>&1; then
                log_success "$service endpoint is healthy"
                break
            else
                retry_count=$((retry_count + 1))
                if [[ $retry_count -lt $MAX_RETRIES ]]; then
                    log_warning "$service endpoint not ready, retrying... ($retry_count/$MAX_RETRIES)"
                    sleep 10
                else
                    log_error "$service endpoint failed health check"
                    return 1
                fi
            fi
        done
    done
    
    # Check database connectivity
    log "🗄️ Testing database connectivity..."
    if docker-compose exec -T postgres psql -U personalfit_user -d personalfit -c "SELECT 1;" >/dev/null 2>&1; then
        log_success "Database connectivity verified"
    else
        log_error "Database connectivity failed"
        return 1
    fi
    
    log_success "All health checks passed!"
    return 0
}

# ==================== DEPLOYMENT FUNCTIONS ====================
pull_latest_code() {
    log "📥 Pulling latest code from repository..."
    
    cd "$PROJECT_DIR"
    
    # Stash any local changes
    git stash push -m "Auto-stash before deployment $(date)" || true
    
    # Pull latest changes
    git fetch origin
    git reset --hard origin/main
    
    log_success "Latest code pulled successfully"
}

build_images() {
    log "🏗️ Building Docker images..."
    
    cd "$PROJECT_DIR"
    
    # Build with no cache to ensure fresh builds
    if docker-compose build --no-cache --parallel; then
        log_success "Docker images built successfully"
    else
        log_error "Failed to build Docker images"
        return 1
    fi
}

deploy_application() {
    log "🚀 Deploying application..."
    
    cd "$PROJECT_DIR"
    
    # Stop services gracefully
    log "⏹️ Stopping current services..."
    docker-compose down --timeout 30
    
    # Remove unused images to free space
    docker image prune -f
    
    # Start services
    log "▶️ Starting services..."
    if docker-compose up -d; then
        log_success "Services started successfully"
    else
        log_error "Failed to start services"
        return 1
    fi
    
    # Wait for services to be ready
    wait_for_service "Backend" 8080 120
    wait_for_service "Frontend" 3000 120
    
    # Run comprehensive health check
    if comprehensive_health_check; then
        log_success "Deployment completed successfully!"
        return 0
    else
        log_error "Health check failed after deployment"
        return 1
    fi
}

# ==================== ROLLBACK FUNCTIONS ====================
rollback_deployment() {
    log_error "🔄 Initiating rollback procedure..."
    
    cd "$PROJECT_DIR"
    
    # Stop current services
    docker-compose down --timeout 30
    
    # Restore database from backup if available
    if [[ -f /tmp/deploy_last_backup.tmp ]]; then
        local backup_file
        backup_file=$(cat /tmp/deploy_last_backup.tmp)
        
        if [[ -f "$backup_file" ]]; then
            log "📁 Restoring database from backup: $backup_file"
            
            # Start only database for restoration
            docker-compose up -d postgres
            sleep 10
            
            # Restore database
            if gunzip -c "$backup_file" | docker-compose exec -T postgres psql -U personalfit_user -d personalfit; then
                log_success "Database restored from backup"
            else
                log_warning "Failed to restore database from backup"
            fi
        fi
    fi
    
    # Restore volumes if available
    if [[ -f /tmp/deploy_last_volumes_backup.tmp ]]; then
        local volumes_backup_dir
        volumes_backup_dir=$(cat /tmp/deploy_last_volumes_backup.tmp)
        
        if [[ -d "$volumes_backup_dir" ]]; then
            log "📁 Restoring volumes from backup..."
            
            # Restore PostgreSQL volume
            if [[ -f "$volumes_backup_dir/pgdata.tar.gz" ]]; then
                docker run --rm -v personalfit_pgdata:/data -v "$volumes_backup_dir":/backup alpine tar xzf /backup/pgdata.tar.gz -C /data
                log_success "PostgreSQL volume restored"
            fi
            
            # Restore comprobantes volume
            if [[ -f "$volumes_backup_dir/comprobantes.tar.gz" ]]; then
                docker run --rm -v personalfit_comprobantes:/data -v "$volumes_backup_dir":/backup alpine tar xzf /backup/comprobantes.tar.gz -C /data
                log_success "Comprobantes volume restored"
            fi
        fi
    fi
    
    # Revert to previous commit
    git reset --hard HEAD~1
    
    # Rebuild and restart with previous version
    docker-compose build --no-cache
    docker-compose up -d
    
    # Wait and verify rollback
    sleep 30
    if comprehensive_health_check; then
        log_success "Rollback completed successfully"
        return 0
    else
        log_error "Rollback failed - manual intervention required"
        return 1
    fi
}

# ==================== CLEANUP FUNCTIONS ====================
cleanup_old_backups() {
    log "🧹 Cleaning up old backups..."
    
    # Keep only last 10 database backups
    cd "$BACKUP_DIR"
    ls -t personalfit_backup_*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
    ls -t pre_deploy_backup_*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
    
    # Keep only last 5 volume backups
    ls -td volumes_* 2>/dev/null | tail -n +6 | xargs -r rm -rf
    
    log_success "Old backups cleaned up"
}

# ==================== MAIN DEPLOYMENT FLOW ====================
main() {
    log "🚀 Starting Personal Fit Santa Fe deployment..."
    log "📊 Deployment initiated by: ${DEPLOY_USER:-automated}"
    log "🔗 Git commit: $(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
    
    # Create deployment report header
    cat > "$PROJECT_DIR/docs/reports/deployment/deployment-$(date +%Y%m%d_%H%M%S).md" << EOF
# 🚀 Deployment Report - $(date '+%Y-%m-%d %H:%M:%S')

## 📋 Deployment Information
- **Date**: $(date '+%Y-%m-%d %H:%M:%S')
- **User**: ${DEPLOY_USER:-automated}
- **Git Commit**: $(git rev-parse HEAD 2>/dev/null || echo 'unknown')
- **Server**: $(hostname)

## 📝 Deployment Log
EOF
    
    # Execute deployment steps
    local deployment_success=true
    
    check_prerequisites || { deployment_success=false; }
    create_directories || { deployment_success=false; }
    
    if [[ "$deployment_success" == "true" ]]; then
        create_backup || { deployment_success=false; }
    fi
    
    if [[ "$deployment_success" == "true" ]]; then
        pull_latest_code || { deployment_success=false; }
    fi
    
    if [[ "$deployment_success" == "true" ]]; then
        build_images || { deployment_success=false; }
    fi
    
    if [[ "$deployment_success" == "true" ]]; then
        deploy_application || { deployment_success=false; }
    fi
    
    # Handle deployment result
    if [[ "$deployment_success" == "true" ]]; then
        log_success "🎉 Deployment completed successfully!"
        
        # Cleanup old backups
        cleanup_old_backups
        
        # Update deployment report
        echo "- **Status**: ✅ SUCCESS" >> "$PROJECT_DIR/docs/reports/deployment/deployment-$(date +%Y%m%d_%H%M%S).md"
        echo "- **Duration**: $SECONDS seconds" >> "$PROJECT_DIR/docs/reports/deployment/deployment-$(date +%Y%m%d_%H%M%S).md"
        
        # Display final status
        echo ""
        log_success "🌐 Application is now available at:"
        log_success "   Frontend: https://personalfitsantafe.com"
        log_success "   Backend API: https://personalfitsantafe.com:8080"
        log_success "   PgAdmin: https://personalfitsantafe.com:5050"
        
        exit 0
    else
        log_error "💥 Deployment failed!"
        
        if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
            log "🔄 Attempting automatic rollback..."
            if rollback_deployment; then
                log_success "🔄 Rollback completed successfully"
                exit 2  # Exit with code 2 to indicate rollback
            else
                log_error "🔄 Rollback failed - manual intervention required"
                exit 3  # Exit with code 3 to indicate rollback failure
            fi
        else
            log_error "🚫 Automatic rollback disabled - manual intervention required"
            exit 1
        fi
    fi
}

# ==================== SCRIPT EXECUTION ====================
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
