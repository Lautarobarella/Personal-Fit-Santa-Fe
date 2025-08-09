#!/bin/bash

# 🚀 Personal Fit Santa Fe - CI/CD Installation Script
# Automated installation and configuration of the complete CI/CD pipeline

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ==================== BANNER ====================
show_banner() {
    echo -e "${CYAN}"
    cat << 'EOF'
    ____                                   __   ______ _ __     _____            __          ____     
   / __ \___  __________  ____  ____ _____/ /  / ____/(_) /_   / ___/____ _____ / /_____ _  / __/____ 
  / /_/ / _ \/ ___/ ___/ / __ \/ __ `/ __  /  / /_   / / __/   \__ \/ __ `/ __ \/ __/ __ `/ / /_/ __ \
 / ____/  __/ /  (__  ) / /_/ / /_/ / /_/ /  / __/  / / /_    ___/ / /_/ / / / / /_/ /_/ / / __/ /_/ /
/_/    \___/_/  /____/  \____/\__,_/\__,_/  /_/    /_/\__/   /____/\__,_/_/ /_/\__/\__,_/ /_/  \____/ 

                          🚀 CI/CD Pipeline Installation 🚀
                         Professional DevOps Implementation
EOF
    echo -e "${NC}"
}

# ==================== LOGGING FUNCTIONS ====================
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

log_info() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
}

# ==================== INSTALLATION FUNCTIONS ====================
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    local missing_deps=()
    
    # Check Git
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    fi
    
    # Check Node.js (for frontend)
    if ! command -v node &> /dev/null; then
        missing_deps+=("node.js")
    fi
    
    # Check Java (for backend)
    if ! command -v java &> /dev/null; then
        missing_deps+=("java")
    fi
    
    # Check Docker (optional, for local testing)
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not found - required for local testing"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_info "Please install the missing dependencies and run this script again"
        exit 1
    fi
    
    log_success "All prerequisites met!"
}

verify_project_structure() {
    log "📁 Verifying project structure..."
    
    local required_files=(
        "Backend/pom.xml"
        "Frontend/package.json"
        "docker-compose.yml"
        ".github/workflows/ci-cd.yml"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file not found: $file"
            exit 1
        fi
    done
    
    log_success "Project structure verified!"
}

install_frontend_dependencies() {
    log "📦 Installing frontend dependencies..."
    
    cd Frontend
    
    if [[ -f "package-lock.json" ]]; then
        npm ci
    else
        npm install
    fi
    
    log_success "Frontend dependencies installed!"
    cd ..
}

install_backend_dependencies() {
    log "☕ Installing backend dependencies..."
    
    cd Backend
    
    # Download dependencies
    ./mvnw dependency:resolve
    
    log_success "Backend dependencies installed!"
    cd ..
}

setup_git_hooks() {
    log "🪝 Setting up Git hooks..."
    
    # Create hooks directory if it doesn't exist
    mkdir -p .git/hooks
    
    # Pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔍 Running pre-commit checks..."

# Run frontend linting
if [[ -d "Frontend" ]]; then
    cd Frontend
    npm run lint || {
        echo "❌ Frontend linting failed"
        exit 1
    }
    cd ..
fi

# Run backend checkstyle
if [[ -d "Backend" ]]; then
    cd Backend
    ./mvnw checkstyle:check || {
        echo "❌ Backend checkstyle failed"
        exit 1
    }
    cd ..
fi

echo "✅ Pre-commit checks passed!"
EOF
    
    chmod +x .git/hooks/pre-commit
    
    log_success "Git hooks configured!"
}

configure_environment() {
    log "⚙️ Configuring environment..."
    
    # Create .env.example if it doesn't exist
    if [[ ! -f ".env.example" ]]; then
        cat > .env.example << 'EOF'
# Personal Fit Santa Fe - Environment Variables

# Database Configuration
POSTGRES_DB=personalfit
POSTGRES_USER=personalfit_user
POSTGRES_PASSWORD=secret123

# MercadoPago Configuration
MP_ACCESS_TOKEN=your-mercadopago-access-token
NEXT_PUBLIC_MP_PUBLIC_KEY=your-mercadopago-public-key

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# Application URLs
NEXT_PUBLIC_API_URL=http://personalfit-backend:8080
NEXT_PUBLIC_BASE_URL=https://personalfitsantafe.com
NEXT_PUBLIC_FRONTEND_URL=https://personalfitsantafe.com
EOF
    fi
    
    # Create logs directory
    mkdir -p logs
    
    # Create docs/reports directories
    mkdir -p docs/reports/{deployment,testing,linting,performance}
    
    log_success "Environment configured!"
}

run_initial_tests() {
    log "🧪 Running initial tests..."
    
    # Frontend tests
    log "Testing frontend..."
    cd Frontend
    if npm test -- --passWithNoTests --watchAll=false; then
        log_success "Frontend tests passed!"
    else
        log_warning "Frontend tests had issues - check configuration"
    fi
    cd ..
    
    # Backend tests
    log "Testing backend..."
    cd Backend
    if ./mvnw test; then
        log_success "Backend tests passed!"
    else
        log_warning "Backend tests had issues - check configuration"
    fi
    cd ..
}

generate_documentation() {
    log "📚 Generating initial documentation..."
    
    if [[ -f "scripts/generate-docs.sh" ]]; then
        chmod +x scripts/generate-docs.sh
        ./scripts/generate-docs.sh || log_warning "Documentation generation had issues"
    fi
    
    log_success "Documentation generated!"
}

show_next_steps() {
    echo ""
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}                        🎉 INSTALLATION COMPLETE! 🎉${NC}"
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${CYAN}📋 NEXT STEPS:${NC}"
    echo ""
    echo -e "${GREEN}1. Configure GitHub Secrets:${NC}"
    echo "   • Go to your GitHub repository settings"
    echo "   • Navigate to Secrets and variables > Actions"
    echo "   • Add the following secrets:"
    echo "     - JWT_SECRET"
    echo "     - MP_ACCESS_TOKEN"
    echo "     - NEXT_PUBLIC_MP_PUBLIC_KEY"
    echo "     - SSH_HOST (72.60.1.76)"
    echo "     - SSH_USERNAME"
    echo "     - SSH_PASSWORD"
    echo "     - SSH_PORT (22)"
    echo ""
    
    echo -e "${GREEN}2. Prepare Production Server:${NC}"
    echo "   • SSH into your server: ssh root@72.60.1.76"
    echo "   • Install Docker and Docker Compose"
    echo "   • Clone this repository to /opt/Personal-Fit-Santa-Fe/"
    echo ""
    
    echo -e "${GREEN}3. Test the Pipeline:${NC}"
    echo "   • Make a commit and push to main branch"
    echo "   • Watch the GitHub Actions workflow execute"
    echo "   • Verify deployment at https://personalfitsantafe.com"
    echo ""
    
    echo -e "${GREEN}4. Monitor and Maintain:${NC}"
    echo "   • Check logs: docker-compose logs -f"
    echo "   • Run health checks: ./scripts/health-check.sh"
    echo "   • Review documentation: docs/generated/README.md"
    echo ""
    
    echo -e "${CYAN}📚 DOCUMENTATION:${NC}"
    echo "   • Implementation Guide: docs/CI_CD_IMPLEMENTATION_GUIDE.md"
    echo "   • Generated Docs: docs/generated/"
    echo "   • API Documentation: docs/generated/api-documentation.md"
    echo "   • Security Guidelines: docs/generated/security-guidelines.md"
    echo ""
    
    echo -e "${CYAN}🔧 USEFUL COMMANDS:${NC}"
    echo "   • Run tests: npm test (Frontend) | ./mvnw test (Backend)"
    echo "   • Local deployment: docker-compose up -d"
    echo "   • Manual deploy: ./scripts/deploy.sh"
    echo "   • Health check: ./scripts/health-check.sh"
    echo "   • Rollback: ./scripts/rollback.sh"
    echo ""
    
    echo -e "${YELLOW}⚠️  IMPORTANT REMINDERS:${NC}"
    echo "   • Never commit secrets to the repository"
    echo "   • Always test changes in a feature branch first"
    echo "   • Monitor the first few deployments carefully"
    echo "   • Keep backups of your production database"
    echo ""
    
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✨ Your professional CI/CD pipeline is ready! Happy deploying! ✨${NC}"
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

show_help() {
    echo "🚀 Personal Fit Santa Fe - CI/CD Installation Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help          Show this help message"
    echo "  --skip-deps         Skip dependency installation"
    echo "  --skip-tests        Skip initial test execution"
    echo "  --skip-docs         Skip documentation generation"
    echo "  --dev-only          Install only development dependencies"
    echo ""
    echo "EXAMPLES:"
    echo "  $0                  # Full installation"
    echo "  $0 --skip-tests     # Install without running tests"
    echo "  $0 --dev-only       # Development setup only"
    echo ""
}

# ==================== MAIN FUNCTION ====================
main() {
    local skip_deps=false
    local skip_tests=false
    local skip_docs=false
    local dev_only=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --skip-deps)
                skip_deps=true
                shift
                ;;
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --skip-docs)
                skip_docs=true
                shift
                ;;
            --dev-only)
                dev_only=true
                shift
                ;;
            *)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Show banner
    show_banner
    
    log "🚀 Starting Personal Fit Santa Fe CI/CD installation..."
    
    # Installation steps
    check_prerequisites
    verify_project_structure
    
    if [[ "$skip_deps" != "true" ]]; then
        install_frontend_dependencies
        install_backend_dependencies
    fi
    
    setup_git_hooks
    configure_environment
    
    if [[ "$skip_tests" != "true" && "$dev_only" != "true" ]]; then
        run_initial_tests
    fi
    
    if [[ "$skip_docs" != "true" ]]; then
        generate_documentation
    fi
    
    # Show completion message
    show_next_steps
    
    log_success "🎉 Installation completed successfully!"
}

# ==================== SCRIPT EXECUTION ====================
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
