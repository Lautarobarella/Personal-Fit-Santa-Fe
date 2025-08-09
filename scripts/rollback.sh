#!/bin/bash

# 🔄 Personal Fit Santa Fe - Rollback Script
# Professional rollback mechanism with database restoration

set -euo pipefail

# ==================== CONFIGURATION ====================
PROJECT_DIR="/opt/Personal-Fit-Santa-Fe"
BACKUP_DIR="/opt/backups/personalfit"
LOG_DIR="$PROJECT_DIR/logs"
ROLLBACK_LOG="$LOG_DIR/rollback-$(date +%Y%m%d_%H%M%S).log"
MAX_ROLLBACK_COMMITS=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================== LOGGING FUNCTIONS ====================
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$ROLLBACK_LOG"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$ROLLBACK_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$ROLLBACK_LOG"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$ROLLBACK_LOG"
}

# ==================== UTILITY FUNCTIONS ====================
cleanup_on_exit() {
    log "🧹 Performing cleanup on exit..."
    # Remove temporary files
    rm -f /tmp/rollback_*.tmp
}

trap cleanup_on_exit EXIT

show_usage() {
    cat << EOF
🔄 Personal Fit Santa Fe - Rollback Script

Usage: $0 [OPTIONS]

OPTIONS:
    -h, --help              Show this help message
    -c, --commits <N>       Number of commits to rollback (default: 1, max: $MAX_ROLLBACK_COMMITS)
    -b, --backup <FILE>     Specific backup file to restore from
    -f, --force             Force rollback without confirmation
    -d, --database-only     Only restore database, don't rollback code
    -s, --skip-database     Skip database restoration
    --list-backups          List available backups
    --dry-run               Show what would be done without executing

EXAMPLES:
    $0                      # Rollback 1 commit with latest backup
    $0 -c 3                 # Rollback 3 commits
    $0 -b backup_file.sql.gz # Restore from specific backup
    $0 --database-only      # Only restore database
    $0 --list-backups       # Show available backups

EOF
}

list_available_backups() {
    log "📋 Available backups in $BACKUP_DIR:"
    echo ""
    
    if [[ -d "$BACKUP_DIR" ]]; then
        # List database backups
        echo "🗄️ Database Backups:"
        ls -lah "$BACKUP_DIR"/*.sql.gz 2>/dev/null | while read -r line; do
            echo "   $line"
        done || echo "   No database backups found"
        
        echo ""
        
        # List volume backups
        echo "📁 Volume Backups:"
        ls -lah "$BACKUP_DIR"/volumes_* 2>/dev/null | while read -r line; do
            echo "   $line"
        done || echo "   No volume backups found"
    else
        log_warning "Backup directory does not exist: $BACKUP_DIR"
    fi
}

# ==================== VALIDATION FUNCTIONS ====================
validate_environment() {
    log "🔍 Validating rollback environment..."
    
    # Check if we're in the correct directory
    if [[ ! -f "$PROJECT_DIR/docker-compose.yml" ]]; then
        log_error "docker-compose.yml not found in $PROJECT_DIR"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running or not accessible"
        exit 1
    fi
    
    # Check if we have git repository
    if [[ ! -d "$PROJECT_DIR/.git" ]]; then
        log_error "Not a git repository: $PROJECT_DIR"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

get_current_state() {
    log "📊 Capturing current state..."
    
    cd "$PROJECT_DIR"
    
    # Get current commit
    local current_commit
    current_commit=$(git rev-parse HEAD)
    echo "$current_commit" > /tmp/rollback_current_commit.tmp
    
    # Get current branch
    local current_branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    echo "$current_branch" > /tmp/rollback_current_branch.tmp
    
    # Get container status
    docker-compose ps > /tmp/rollback_container_status.tmp
    
    log_success "Current state captured"
    log "Current commit: $current_commit"
    log "Current branch: $current_branch"
}

# ==================== BACKUP FUNCTIONS ====================
create_emergency_backup() {
    log "🚨 Creating emergency backup before rollback..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local emergency_backup="$BACKUP_DIR/emergency_rollback_backup_$timestamp.sql"
    
    cd "$PROJECT_DIR"
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Create database backup
    if docker-compose exec -T postgres pg_dump -U personalfit_user -d personalfit > "$emergency_backup" 2>/dev/null; then
        gzip "$emergency_backup"
        log_success "Emergency database backup created: ${emergency_backup}.gz"
        echo "${emergency_backup}.gz" > /tmp/rollback_emergency_backup.tmp
    else
        log_warning "Failed to create emergency database backup"
    fi
    
    # Create emergency volumes backup
    local volumes_backup_dir="$BACKUP_DIR/emergency_volumes_$timestamp"
    mkdir -p "$volumes_backup_dir"
    
    if docker run --rm -v personalfit_pgdata:/data -v "$volumes_backup_dir":/backup alpine tar czf /backup/pgdata.tar.gz -C /data . 2>/dev/null; then
        log_success "Emergency PostgreSQL volume backup created"
    fi
    
    if docker run --rm -v personalfit_comprobantes:/data -v "$volumes_backup_dir":/backup alpine tar czf /backup/comprobantes.tar.gz -C /data . 2>/dev/null; then
        log_success "Emergency comprobantes volume backup created"
    fi
    
    echo "$volumes_backup_dir" > /tmp/rollback_emergency_volumes.tmp
}

find_latest_backup() {
    local backup_file=""
    
    # Look for the most recent backup
    if [[ -d "$BACKUP_DIR" ]]; then
        backup_file=$(ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -1 || echo "")
    fi
    
    if [[ -n "$backup_file" && -f "$backup_file" ]]; then
        echo "$backup_file"
        return 0
    else
        return 1
    fi
}

restore_database() {
    local backup_file="$1"
    
    log "🗄️ Restoring database from backup: $backup_file"
    
    cd "$PROJECT_DIR"
    
    # Validate backup file
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Stop all services except database
    log "⏹️ Stopping application services..."
    docker-compose stop personalfit-frontend personalfit-backend
    
    # Ensure database is running
    docker-compose up -d postgres
    sleep 10
    
    # Wait for database to be ready
    local retry_count=0
    while [[ $retry_count -lt 30 ]]; do
        if docker-compose exec -T postgres pg_isready -U personalfit_user -d personalfit >/dev/null 2>&1; then
            break
        fi
        sleep 2
        retry_count=$((retry_count + 1))
    done
    
    if [[ $retry_count -eq 30 ]]; then
        log_error "Database failed to become ready for restoration"
        return 1
    fi
    
    # Drop existing connections
    docker-compose exec -T postgres psql -U personalfit_user -d postgres -c "
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = 'personalfit' AND pid <> pg_backend_pid();" >/dev/null 2>&1 || true
    
    # Restore database
    if gunzip -c "$backup_file" | docker-compose exec -T postgres psql -U personalfit_user -d personalfit >/dev/null 2>&1; then
        log_success "Database restored successfully from $backup_file"
        return 0
    else
        log_error "Failed to restore database from $backup_file"
        return 1
    fi
}

restore_volumes() {
    local volumes_backup_dir="$1"
    
    log "📁 Restoring volumes from: $volumes_backup_dir"
    
    if [[ ! -d "$volumes_backup_dir" ]]; then
        log_warning "Volume backup directory not found: $volumes_backup_dir"
        return 1
    fi
    
    cd "$PROJECT_DIR"
    
    # Stop services
    docker-compose down
    
    # Restore PostgreSQL volume
    if [[ -f "$volumes_backup_dir/pgdata.tar.gz" ]]; then
        log "📦 Restoring PostgreSQL data volume..."
        if docker run --rm -v personalfit_pgdata:/data -v "$volumes_backup_dir":/backup alpine sh -c "rm -rf /data/* && tar xzf /backup/pgdata.tar.gz -C /data"; then
            log_success "PostgreSQL volume restored"
        else
            log_error "Failed to restore PostgreSQL volume"
        fi
    fi
    
    # Restore comprobantes volume
    if [[ -f "$volumes_backup_dir/comprobantes.tar.gz" ]]; then
        log "📦 Restoring comprobantes volume..."
        if docker run --rm -v personalfit_comprobantes:/data -v "$volumes_backup_dir":/backup alpine sh -c "rm -rf /data/* && tar xzf /backup/comprobantes.tar.gz -C /data"; then
            log_success "Comprobantes volume restored"
        else
            log_error "Failed to restore comprobantes volume"
        fi
    fi
}

# ==================== ROLLBACK FUNCTIONS ====================
rollback_code() {
    local commits_to_rollback="$1"
    
    log "🔄 Rolling back code by $commits_to_rollback commit(s)..."
    
    cd "$PROJECT_DIR"
    
    # Validate commits_to_rollback
    if [[ $commits_to_rollback -lt 1 || $commits_to_rollback -gt $MAX_ROLLBACK_COMMITS ]]; then
        log_error "Invalid number of commits to rollback: $commits_to_rollback (must be 1-$MAX_ROLLBACK_COMMITS)"
        return 1
    fi
    
    # Check if we have enough commits to rollback
    local available_commits
    available_commits=$(git rev-list --count HEAD)
    
    if [[ $available_commits -lt $commits_to_rollback ]]; then
        log_error "Not enough commits in history to rollback $commits_to_rollback commits"
        return 1
    fi
    
    # Show commits that will be rolled back
    log "📋 Commits that will be rolled back:"
    git log --oneline -n "$commits_to_rollback"
    
    # Perform rollback
    if git reset --hard "HEAD~$commits_to_rollback"; then
        log_success "Code rolled back by $commits_to_rollback commit(s)"
        
        # Show current commit after rollback
        local new_commit
        new_commit=$(git rev-parse HEAD)
        log "📍 Now at commit: $new_commit"
        
        return 0
    else
        log_error "Failed to rollback code"
        return 1
    fi
}

rebuild_and_restart() {
    log "🏗️ Rebuilding and restarting application..."
    
    cd "$PROJECT_DIR"
    
    # Stop all services
    docker-compose down --timeout 30
    
    # Remove old images to ensure clean rebuild
    docker-compose build --no-cache --pull
    
    # Start services
    if docker-compose up -d; then
        log_success "Services restarted successfully"
        
        # Wait for services to be ready
        sleep 30
        
        # Run basic health check
        if ./scripts/health-check.sh >/dev/null 2>&1; then
            log_success "Health check passed after rollback"
            return 0
        else
            log_warning "Health check failed after rollback - manual verification needed"
            return 1
        fi
    else
        log_error "Failed to restart services"
        return 1
    fi
}

# ==================== CONFIRMATION FUNCTIONS ====================
confirm_rollback() {
    local commits="$1"
    local backup_file="$2"
    local skip_database="$3"
    
    echo ""
    log_warning "🚨 ROLLBACK CONFIRMATION REQUIRED"
    echo "=============================================="
    echo "📍 Current commit: $(git rev-parse HEAD)"
    echo "🔄 Commits to rollback: $commits"
    echo "🗄️ Database backup to restore: ${backup_file:-'None (skipped)'}"
    echo "⚠️  Skip database restoration: $skip_database"
    echo "=============================================="
    echo ""
    
    if [[ "${FORCE_ROLLBACK:-false}" == "true" ]]; then
        log_warning "Force mode enabled - proceeding without confirmation"
        return 0
    fi
    
    read -p "Are you sure you want to proceed with this rollback? (yes/no): " -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "✅ Rollback confirmed by user"
        return 0
    else
        log "❌ Rollback cancelled by user"
        return 1
    fi
}

# ==================== MAIN ROLLBACK FUNCTION ====================
perform_rollback() {
    local commits_to_rollback="$1"
    local backup_file="$2"
    local skip_database="$3"
    local database_only="$4"
    
    log "🔄 Starting rollback process..."
    
    # Create emergency backup
    create_emergency_backup
    
    # Confirm rollback
    if ! confirm_rollback "$commits_to_rollback" "$backup_file" "$skip_database"; then
        exit 0
    fi
    
    local rollback_success=true
    
    # Restore database if requested and backup is available
    if [[ "$skip_database" != "true" && -n "$backup_file" ]]; then
        if ! restore_database "$backup_file"; then
            log_error "Database restoration failed"
            rollback_success=false
        fi
    fi
    
    # Rollback code if not database-only mode
    if [[ "$database_only" != "true" ]]; then
        if ! rollback_code "$commits_to_rollback"; then
            log_error "Code rollback failed"
            rollback_success=false
        fi
    fi
    
    # Rebuild and restart if not database-only mode
    if [[ "$database_only" != "true" ]]; then
        if ! rebuild_and_restart; then
            log_error "Application restart failed"
            rollback_success=false
        fi
    elif [[ "$skip_database" != "true" ]]; then
        # Just restart database-related services
        cd "$PROJECT_DIR"
        docker-compose up -d
        sleep 20
    fi
    
    # Generate rollback report
    generate_rollback_report "$commits_to_rollback" "$backup_file" "$rollback_success"
    
    if [[ "$rollback_success" == "true" ]]; then
        log_success "🎉 Rollback completed successfully!"
        return 0
    else
        log_error "💥 Rollback completed with errors - manual intervention may be required"
        return 1
    fi
}

generate_rollback_report() {
    local commits="$1"
    local backup_file="$2"
    local success="$3"
    
    local report_file="$PROJECT_DIR/docs/reports/rollback-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# 🔄 Rollback Report - $(date '+%Y-%m-%d %H:%M:%S')

## 📋 Rollback Information
- **Date**: $(date '+%Y-%m-%d %H:%M:%S')
- **User**: $(whoami)
- **Server**: $(hostname)
- **Status**: $(if [[ "$success" == "true" ]]; then echo "✅ SUCCESS"; else echo "❌ FAILED"; fi)

## 🔄 Rollback Details
- **Commits Rolled Back**: $commits
- **Database Backup Used**: ${backup_file:-'None'}
- **Previous Commit**: $(cat /tmp/rollback_current_commit.tmp 2>/dev/null || echo 'Unknown')
- **Current Commit**: $(git rev-parse HEAD 2>/dev/null || echo 'Unknown')

## 📊 System Status After Rollback
$(./scripts/health-check.sh 2>/dev/null | tail -20 || echo "Health check not available")

## 🗄️ Emergency Backup Created
- **Database**: $(cat /tmp/rollback_emergency_backup.tmp 2>/dev/null || echo 'None')
- **Volumes**: $(cat /tmp/rollback_emergency_volumes.tmp 2>/dev/null || echo 'None')

## 📝 Next Steps
$(if [[ "$success" == "true" ]]; then
    echo "- ✅ Rollback completed successfully"
    echo "- 🔍 Verify application functionality"
    echo "- 📊 Monitor system performance"
else
    echo "- ❌ Rollback failed - investigate issues"
    echo "- 🔍 Check application logs"
    echo "- 🆘 Consider manual recovery"
fi)

---
*Report generated at $(date '+%Y-%m-%d %H:%M:%S')*
EOF
    
    log_success "Rollback report generated: $report_file"
}

# ==================== MAIN FUNCTION ====================
main() {
    # Default values
    local commits_to_rollback=1
    local backup_file=""
    local skip_database=false
    local database_only=false
    local dry_run=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -c|--commits)
                commits_to_rollback="$2"
                shift 2
                ;;
            -b|--backup)
                backup_file="$2"
                shift 2
                ;;
            -f|--force)
                FORCE_ROLLBACK=true
                shift
                ;;
            -d|--database-only)
                database_only=true
                shift
                ;;
            -s|--skip-database)
                skip_database=true
                shift
                ;;
            --list-backups)
                list_available_backups
                exit 0
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Create log directory
    mkdir -p "$LOG_DIR"
    mkdir -p "$PROJECT_DIR/docs/reports"
    
    log "🔄 Personal Fit Santa Fe Rollback Script Started"
    
    # Validate environment
    validate_environment
    
    # Get current state
    get_current_state
    
    # If no backup file specified, find the latest one
    if [[ -z "$backup_file" && "$skip_database" != "true" ]]; then
        if backup_file=$(find_latest_backup); then
            log "📁 Using latest backup: $backup_file"
        else
            log_warning "No backup file found - database restoration will be skipped"
            skip_database=true
        fi
    fi
    
    # Dry run mode
    if [[ "$dry_run" == "true" ]]; then
        log "🔍 DRY RUN MODE - Showing what would be done:"
        echo ""
        echo "📍 Current commit: $(git rev-parse HEAD)"
        echo "🔄 Would rollback: $commits_to_rollback commit(s)"
        echo "🗄️ Would restore from: ${backup_file:-'None (skipped)'}"
        echo "⚠️  Skip database: $skip_database"
        echo "🔧 Database only: $database_only"
        echo ""
        log "No changes would be made in dry run mode"
        exit 0
    fi
    
    # Perform rollback
    if perform_rollback "$commits_to_rollback" "$backup_file" "$skip_database" "$database_only"; then
        log_success "🎉 Rollback completed successfully!"
        exit 0
    else
        log_error "💥 Rollback failed!"
        exit 1
    fi
}

# ==================== SCRIPT EXECUTION ====================
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
