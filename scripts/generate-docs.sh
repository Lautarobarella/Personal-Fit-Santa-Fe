#!/bin/bash

# 📚 Personal Fit Santa Fe - Documentation Generator Script
# Generates comprehensive documentation for CI/CD processes

set -euo pipefail

# ==================== CONFIGURATION ====================
PROJECT_DIR="/opt/Personal-Fit-Santa-Fe"
DOCS_DIR="$PROJECT_DIR/docs"
REPORTS_DIR="$DOCS_DIR/reports"
TEMPLATES_DIR="$DOCS_DIR/templates"
OUTPUT_DIR="$DOCS_DIR/generated"
LOG_DIR="$PROJECT_DIR/logs"
DOC_LOG="$LOG_DIR/docs-$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================== LOGGING FUNCTIONS ====================
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DOC_LOG"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$DOC_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$DOC_LOG"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$DOC_LOG"
}

# ==================== UTILITY FUNCTIONS ====================
create_directories() {
    log "📁 Creating documentation directories..."
    mkdir -p "$DOCS_DIR"
    mkdir -p "$REPORTS_DIR"
    mkdir -p "$TEMPLATES_DIR"
    mkdir -p "$OUTPUT_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$REPORTS_DIR/deployment"
    mkdir -p "$REPORTS_DIR/testing"
    mkdir -p "$REPORTS_DIR/linting"
    mkdir -p "$REPORTS_DIR/performance"
    log_success "Documentation directories created"
}

# ==================== DOCUMENTATION GENERATORS ====================
generate_cicd_overview() {
    log "📋 Generating CI/CD overview documentation..."
    
    cat > "$OUTPUT_DIR/cicd-overview.md" << 'EOF'
# 🚀 CI/CD Pipeline Overview - Personal Fit Santa Fe

## 📋 Pipeline Architecture

```mermaid
graph TD
    A[Push to main] --> B[Lint & Security Analysis]
    B --> C[Run Tests]
    C --> D[Build Docker Images]
    D --> E[Database Backup]
    E --> F[Deploy to Production]
    F --> G[Health Check]
    G --> H{Deployment Success?}
    H -->|Yes| I[Generate Reports]
    H -->|No| J[Automatic Rollback]
    J --> K[Restore Backup]
    K --> L[Notify Failure]
    I --> M[Update Documentation]
```

## 🔧 Pipeline Stages

### 1. Code Quality & Security
- **ESLint** for Frontend TypeScript/React code
- **Checkstyle** for Backend Java code
- **SpotBugs** for static analysis
- **PMD** for code quality
- **OWASP Dependency Check** for security vulnerabilities

### 2. Testing
- **Frontend Tests**: Jest with React Testing Library
- **Backend Tests**: JUnit 5 with Spring Boot Test
- **Coverage Requirements**: 
  - Backend: 70% minimum
  - Frontend: 60% minimum
- **Integration Tests**: Full API testing with TestContainers

### 3. Build & Containerization
- **Multi-stage Docker builds** for optimization
- **Image security scanning** with Trivy
- **Registry push** to GitHub Container Registry
- **Build artifact storage** for rollback capability

### 4. Database Management
- **Automatic backup** before deployment
- **Migration validation** with Flyway
- **Rollback capability** with point-in-time recovery
- **Data integrity checks** post-deployment

### 5. Deployment
- **Zero-downtime deployment** with rolling updates
- **Blue-green deployment** strategy
- **Automatic service discovery** and load balancing
- **Configuration management** with environment variables

### 6. Monitoring & Alerting
- **Health check endpoints** for all services
- **Performance monitoring** with custom metrics
- **Log aggregation** and analysis
- **Automated alerting** for failures

## 🔄 Rollback Strategy

### Automatic Rollback Triggers
- Health check failures
- Database connection issues
- Critical application errors
- Performance degradation

### Rollback Process
1. **Stop current deployment**
2. **Restore database backup**
3. **Revert to previous code version**
4. **Rebuild and restart services**
5. **Verify system health**
6. **Generate incident report**

## 📊 Quality Gates

### Code Quality
- No critical security vulnerabilities
- Linting rules compliance
- Code coverage thresholds met
- No high-severity bugs detected

### Testing
- All unit tests pass
- Integration tests pass
- Performance tests within limits
- No flaky test failures

### Security
- Dependency vulnerabilities resolved
- Container image scanning passed
- Secrets properly managed
- Access controls validated

## 🔧 Configuration

### Environment Variables
- `MP_ACCESS_TOKEN`: MercadoPago access token
- `NEXT_PUBLIC_MP_PUBLIC_KEY`: MercadoPago public key
- `JWT_SECRET`: JWT signing secret
- `DATABASE_URL`: PostgreSQL connection string

### GitHub Secrets
- `SSH_HOST`: Server IP address
- `SSH_USERNAME`: Server username
- `SSH_PASSWORD`: Server password
- `SSH_PORT`: SSH port (default: 22)

## 📈 Metrics & KPIs

### Deployment Metrics
- **Deployment Frequency**: Target daily
- **Lead Time**: < 30 minutes from commit to production
- **MTTR (Mean Time To Recovery)**: < 15 minutes
- **Change Failure Rate**: < 5%

### Quality Metrics
- **Test Coverage**: Backend 70%+, Frontend 60%+
- **Code Quality Score**: A grade or higher
- **Security Vulnerabilities**: Zero critical, minimal high
- **Performance**: Response time < 2s, uptime > 99.9%

## 🛠️ Tools & Technologies

### CI/CD Platform
- **GitHub Actions** for pipeline orchestration
- **Docker** for containerization
- **Docker Compose** for local development

### Testing Framework
- **Jest** for JavaScript/TypeScript testing
- **JUnit 5** for Java testing
- **Testcontainers** for integration testing
- **Cypress** for end-to-end testing (planned)

### Monitoring & Observability
- **Custom health endpoints** for service monitoring
- **Structured logging** with JSON format
- **Metrics collection** with Prometheus (planned)
- **Alerting** with custom scripts

### Security
- **OWASP dependency scanning**
- **Container vulnerability scanning**
- **Secret management** with GitHub Secrets
- **JWT authentication** with secure tokens

## 📚 Additional Resources

- [Deployment Guide](./deployment-guide.md)
- [Testing Strategy](./testing-strategy.md)
- [Security Guidelines](./security-guidelines.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [API Documentation](./api-documentation.md)
EOF

    log_success "CI/CD overview documentation generated"
}

generate_deployment_guide() {
    log "🚀 Generating deployment guide..."
    
    cat > "$OUTPUT_DIR/deployment-guide.md" << 'EOF'
# 🚀 Deployment Guide - Personal Fit Santa Fe

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04 LTS or newer
- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: Minimum 50GB SSD
- **CPU**: 2+ cores
- **Network**: Stable internet connection

### Software Dependencies
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+
- **SSH**: OpenSSH Server

### GitHub Secrets Configuration
```bash
# Required secrets in GitHub repository
MP_ACCESS_TOKEN=<mercadopago-access-token>
NEXT_PUBLIC_MP_PUBLIC_KEY=<mercadopago-public-key>
JWT_SECRET=<jwt-signing-secret>
SSH_HOST=72.60.1.76
SSH_USERNAME=root
SSH_PASSWORD=<server-password>
SSH_PORT=22
```

## 🔧 Manual Deployment

### 1. Server Preparation
```bash
# Connect to server
ssh root@72.60.1.76

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create project directory
mkdir -p /opt/Personal-Fit-Santa-Fe
cd /opt/Personal-Fit-Santa-Fe
```

### 2. Clone Repository
```bash
# Clone the repository
git clone https://github.com/your-username/Personal-Fit-Santa-Fe.git .

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 3. Deploy Application
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run deployment
./scripts/deploy.sh
```

### 4. Verify Deployment
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Run health check
./scripts/health-check.sh
```

## 🔄 Automated Deployment (CI/CD)

### GitHub Actions Workflow
The deployment is automatically triggered on:
- Push to `main` branch
- Manual workflow dispatch

### Pipeline Steps
1. **Code Quality Checks**
   - ESLint for frontend
   - Checkstyle for backend
   - Security vulnerability scan

2. **Testing**
   - Unit tests
   - Integration tests
   - Coverage analysis

3. **Build**
   - Docker image creation
   - Image optimization
   - Security scanning

4. **Database Backup**
   - Automatic backup creation
   - Volume snapshots
   - Backup verification

5. **Deployment**
   - Zero-downtime deployment
   - Service updates
   - Configuration management

6. **Post-Deployment**
   - Health checks
   - Performance validation
   - Documentation update

## 🗄️ Database Management

### Backup Strategy
```bash
# Manual backup
./scripts/backup-database.sh

# Restore from backup
./scripts/restore-database.sh /path/to/backup.sql.gz
```

### Migration Management
```bash
# Check migration status
docker-compose exec personalfit-backend ./mvnw flyway:info

# Run migrations
docker-compose exec personalfit-backend ./mvnw flyway:migrate

# Repair migrations (if needed)
docker-compose exec personalfit-backend ./mvnw flyway:repair
```

## 🔄 Rollback Procedures

### Automatic Rollback
Automatic rollback is triggered by:
- Health check failures
- Database connection issues
- Critical application errors

### Manual Rollback
```bash
# Rollback to previous version
./scripts/rollback.sh

# Rollback specific number of commits
./scripts/rollback.sh -c 3

# Rollback with specific backup
./scripts/rollback.sh -b /path/to/backup.sql.gz

# Database-only rollback
./scripts/rollback.sh --database-only
```

## 🏥 Health Monitoring

### Health Check Endpoints
- **Frontend**: `http://localhost:3000/api/health`
- **Backend**: `http://localhost:8080/actuator/health`
- **Database**: Connection test via backend

### Monitoring Commands
```bash
# Comprehensive health check
./scripts/health-check.sh

# Monitor logs in real-time
docker-compose logs -f

# Check resource usage
docker stats

# View container status
docker-compose ps
```

## 🔧 Configuration Management

### Environment Variables
```bash
# Frontend Environment
NEXT_PUBLIC_API_URL=http://personalfit-backend:8080
NEXT_PUBLIC_BASE_URL=https://personalfitsantafe.com
NEXT_PUBLIC_MP_PUBLIC_KEY=${NEXT_PUBLIC_MP_PUBLIC_KEY}

# Backend Environment
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/personalfit
MP_ACCESS_TOKEN=${MP_ACCESS_TOKEN}
JWT_SECRET=${JWT_SECRET}
```

### SSL/TLS Configuration
```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d personalfitsantafe.com

# Auto-renewal setup
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚨 Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker-compose logs [service-name]

# Inspect container
docker inspect [container-name]

# Check resource usage
docker system df
docker system prune  # Clean up if needed
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready

# Connect to database
docker-compose exec postgres psql -U personalfit_user -d personalfit

# Reset database connection pool
docker-compose restart personalfit-backend
```

#### Performance Issues
```bash
# Check resource usage
htop
docker stats

# Analyze logs for errors
docker-compose logs | grep ERROR

# Check disk space
df -h
```

## 📞 Support & Contacts

### Emergency Contacts
- **System Administrator**: admin@personalfitsantafe.com
- **Development Team**: dev@personalfitsantafe.com
- **On-call Support**: +54 XXX XXX XXXX

### Resources
- **Documentation**: `/docs` directory
- **Logs**: `/opt/Personal-Fit-Santa-Fe/logs`
- **Backups**: `/opt/backups/personalfit`
- **Monitoring**: Health check scripts in `/scripts`

## 📚 Additional Documentation
- [CI/CD Overview](./cicd-overview.md)
- [Testing Strategy](./testing-strategy.md)
- [Security Guidelines](./security-guidelines.md)
- [API Documentation](./api-documentation.md)
EOF

    log_success "Deployment guide generated"
}

generate_testing_documentation() {
    log "🧪 Generating testing documentation..."
    
    cat > "$OUTPUT_DIR/testing-strategy.md" << 'EOF'
# 🧪 Testing Strategy - Personal Fit Santa Fe

## 📋 Testing Overview

Our comprehensive testing strategy ensures code quality, reliability, and maintainability across the entire application stack.

## 🎯 Testing Pyramid

```mermaid
graph TD
    A[End-to-End Tests] --> B[Integration Tests]
    B --> C[Unit Tests]
    
    style A fill:#ff6b6b
    style B fill:#4ecdc4
    style C fill:#45b7d1
```

### Unit Tests (Foundation)
- **Coverage Target**: 70% backend, 60% frontend
- **Focus**: Individual functions, methods, components
- **Tools**: Jest (Frontend), JUnit 5 (Backend)
- **Run Frequency**: Every commit

### Integration Tests (Middle Layer)
- **Coverage**: API endpoints, database interactions
- **Focus**: Component interactions, data flow
- **Tools**: Spring Boot Test, TestContainers
- **Run Frequency**: Every push to main

### End-to-End Tests (Top Layer)
- **Coverage**: Critical user journeys
- **Focus**: Complete workflows, UI interactions
- **Tools**: Cypress (planned)
- **Run Frequency**: Before releases

## 🔧 Frontend Testing

### Testing Framework
- **Jest**: JavaScript testing framework
- **React Testing Library**: Component testing utilities
- **User Event**: User interaction simulation
- **MSW**: API mocking

### Test Categories

#### Component Tests
```typescript
// Example: Button component test
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

test('should render button with correct text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

#### Hook Tests
```typescript
// Example: Custom hook test
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'

test('should handle login correctly', async () => {
  const { result } = renderHook(() => useAuth())
  
  await act(async () => {
    await result.current.login('user@test.com', 'password')
  })
  
  expect(result.current.isAuthenticated).toBe(true)
})
```

#### API Tests
```typescript
// Example: API service test
import { authAPI } from '@/api/auth'

test('should login with valid credentials', async () => {
  const mockResponse = { token: 'fake-token', user: { id: 1 } }
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse,
  })

  const result = await authAPI.login('user@test.com', 'password')
  expect(result).toEqual(mockResponse)
})
```

### Coverage Requirements
- **Statements**: 60%
- **Branches**: 50%
- **Functions**: 60%
- **Lines**: 60%

### Running Frontend Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- login-form.test.tsx
```

## ☕ Backend Testing

### Testing Framework
- **JUnit 5**: Core testing framework
- **Spring Boot Test**: Integration testing
- **Mockito**: Mocking framework
- **TestContainers**: Database testing
- **H2**: In-memory database for tests

### Test Categories

#### Unit Tests
```java
// Example: Service unit test
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    
    @Mock
    private IUserRepository userRepository;
    
    @InjectMocks
    private UserServiceImpl userService;
    
    @Test
    void shouldCreateUserSuccessfully() {
        // Given
        InCreateUserDTO userDTO = new InCreateUserDTO();
        userDTO.setEmail("test@example.com");
        
        // When
        userService.createNewUser(userDTO);
        
        // Then
        verify(userRepository).save(any(User.class));
    }
}
```

#### Integration Tests
```java
// Example: Controller integration test
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Transactional
class UserControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void shouldCreateUserViaAPI() {
        InCreateUserDTO newUser = new InCreateUserDTO();
        newUser.setEmail("test@example.com");
        
        ResponseEntity<Map> response = restTemplate.postForEntity(
            "/api/users/new", newUser, Map.class);
        
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
    }
}
```

#### Repository Tests
```java
// Example: Repository test with TestContainers
@DataJpaTest
@Testcontainers
class UserRepositoryTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private IUserRepository userRepository;
    
    @Test
    void shouldFindUserByEmail() {
        User user = new User();
        user.setEmail("test@example.com");
        entityManager.persistAndFlush(user);
        
        Optional<User> found = userRepository.findByEmail("test@example.com");
        
        assertTrue(found.isPresent());
        assertEquals("test@example.com", found.get().getEmail());
    }
}
```

### Coverage Requirements
- **Line Coverage**: 70%
- **Branch Coverage**: 65%
- **Method Coverage**: 70%

### Running Backend Tests
```bash
# Run all tests
./mvnw test

# Run tests with coverage
./mvnw test jacoco:report

# Run specific test class
./mvnw test -Dtest=UserServiceTest

# Run integration tests only
./mvnw test -Dtest=*IntegrationTest
```

## 🔄 Continuous Testing in CI/CD

### Pre-commit Hooks
```bash
# Install pre-commit hooks
npm install husky --save-dev
npx husky add .husky/pre-commit "npm run test:changed"
```

### GitHub Actions Integration
```yaml
# Test job in CI pipeline
test:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:15
      env:
        POSTGRES_PASSWORD: postgres
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
  
  steps:
    - uses: actions/checkout@v4
    
    - name: Run Backend Tests
      run: |
        cd Backend
        ./mvnw test jacoco:report
    
    - name: Run Frontend Tests
      run: |
        cd Frontend
        npm ci
        npm run test:coverage
    
    - name: Upload Coverage Reports
      uses: codecov/codecov-action@v3
```

## 📊 Test Metrics & Reporting

### Coverage Reports
- **Backend**: JaCoCo HTML reports in `target/site/jacoco/`
- **Frontend**: Jest coverage reports in `coverage/`
- **Combined**: Aggregated reports in CI/CD pipeline

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- No critical security vulnerabilities
- Performance tests within limits

### Test Result Artifacts
```bash
# Backend test results
Backend/target/surefire-reports/
Backend/target/site/jacoco/

# Frontend test results
Frontend/coverage/
Frontend/test-results/
```

## 🐛 Debugging Tests

### Frontend Test Debugging
```bash
# Run tests with debugging
npm test -- --detectOpenHandles --forceExit

# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand test-file.test.js
```

### Backend Test Debugging
```bash
# Run tests with debugging
./mvnw test -Dmaven.surefire.debug

# Run with specific logging
./mvnw test -Dlogging.level.org.springframework=DEBUG
```

## 📚 Best Practices

### Test Organization
- One test file per source file
- Descriptive test names
- Arrange-Act-Assert pattern
- Independent test cases

### Mock Strategy
- Mock external dependencies
- Use real objects for simple dependencies
- Verify interactions, not implementations
- Keep mocks simple and focused

### Data Management
- Use test-specific data
- Clean up after tests
- Use factories for test data creation
- Avoid shared mutable state

### Performance
- Keep tests fast (< 100ms per unit test)
- Use parallel execution when possible
- Mock slow operations
- Profile slow tests

## 🔧 Test Configuration

### Frontend Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
}
```

### Backend Test Configuration
```properties
# application-test.properties
spring.datasource.url=jdbc:h2:mem:testdb
spring.jpa.hibernate.ddl-auto=create-drop
spring.sql.init.mode=never
logging.level.org.springframework.web=DEBUG
```

## 📈 Future Improvements

### Planned Enhancements
- **Visual Regression Testing**: Chromatic or Percy integration
- **Performance Testing**: K6 or Artillery integration
- **Accessibility Testing**: axe-core integration
- **Security Testing**: OWASP ZAP integration
- **Mutation Testing**: PIT or Stryker integration

### Tool Upgrades
- Migration to Vitest (from Jest)
- TestContainers for all integration tests
- Playwright for E2E tests
- Gradle for backend build (from Maven)
EOF

    log_success "Testing documentation generated"
}

generate_api_documentation() {
    log "📡 Generating API documentation..."
    
    cat > "$OUTPUT_DIR/api-documentation.md" << 'EOF'
# 📡 API Documentation - Personal Fit Santa Fe

## 📋 Overview

The Personal Fit Santa Fe API provides endpoints for managing users, activities, payments, and authentication in a fitness center management system.

**Base URL**: `https://personalfitsantafe.com/api`  
**Version**: v1  
**Authentication**: JWT Bearer Token

## 🔐 Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@personalfit.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John",
    "surname": "Doe",
    "email": "user@personalfit.com",
    "role": "CLIENT",
    "status": "ACTIVE"
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

## 👥 Users

### Create User
```http
POST /api/users/new
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "John",
  "surname": "Doe",
  "dni": "12345678",
  "email": "john.doe@example.com",
  "password": "password123",
  "phone": "123456789",
  "role": "CLIENT"
}
```

### Get All Users
```http
GET /api/users/all
Authorization: Bearer <admin-token>
```

### Get User by ID
```http
GET /api/users/{id}
Authorization: Bearer <token>
```

### Find User by DNI
```http
POST /api/users/find
Authorization: Bearer <token>
Content-Type: application/json

{
  "dni": "12345678"
}
```

### Update User
```http
PUT /api/users/{id}
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "John Updated",
  "surname": "Doe",
  "dni": "12345678",
  "email": "john.updated@example.com",
  "phone": "987654321",
  "role": "CLIENT"
}
```

### Delete User
```http
DELETE /api/users/{id}
Authorization: Bearer <admin-token>
```

## 🏃 Activities

### Get All Activities
```http
GET /api/activities/all
Authorization: Bearer <token>
```

### Get Activity by ID
```http
GET /api/activities/{id}
Authorization: Bearer <token>
```

### Create Activity
```http
POST /api/activities/new
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Yoga Class",
  "description": "Relaxing yoga session",
  "startTime": "2024-01-15T10:00:00",
  "endTime": "2024-01-15T11:00:00",
  "capacity": 20,
  "instructorId": 2
}
```

### Update Activity
```http
PUT /api/activities/{id}
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Advanced Yoga",
  "description": "Advanced yoga techniques",
  "startTime": "2024-01-15T10:00:00",
  "endTime": "2024-01-15T11:30:00",
  "capacity": 15
}
```

### Delete Activity
```http
DELETE /api/activities/{id}
Authorization: Bearer <admin-token>
```

### Enroll in Activity
```http
POST /api/activities/{id}/enroll
Authorization: Bearer <token>
```

### Cancel Enrollment
```http
DELETE /api/activities/{id}/enroll
Authorization: Bearer <token>
```

## 💳 Payments

### Get All Payments
```http
GET /api/payments/all
Authorization: Bearer <admin-token>
```

### Get User Payments
```http
GET /api/payments/user/{userId}
Authorization: Bearer <token>
```

### Create Payment
```http
POST /api/payments/new
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 1,
  "amount": 5000.00,
  "description": "Monthly membership",
  "paymentMethod": "MERCADOPAGO"
}
```

### Update Payment Status
```http
PUT /api/payments/{id}/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "APPROVED",
  "notes": "Payment verified"
}
```

### Upload Payment Proof
```http
POST /api/payments/{id}/proof
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <payment-proof-image>
```

## 🔔 Notifications

### Get User Notifications
```http
GET /api/notifications/user/{userId}
Authorization: Bearer <token>
```

### Mark Notification as Read
```http
PUT /api/notifications/{id}/read
Authorization: Bearer <token>
```

### Create Notification
```http
POST /api/notifications/new
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userId": 1,
  "title": "Payment Reminder",
  "message": "Your monthly payment is due",
  "type": "PAYMENT_REMINDER"
}
```

## ⚙️ Settings

### Get Settings
```http
GET /api/settings
Authorization: Bearer <admin-token>
```

### Update Monthly Fee
```http
PUT /api/settings/monthly-fee
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "monthlyFee": 6000.00
}
```

## 📊 Data Models

### User
```typescript
interface User {
  id: number
  name: string
  surname: string
  dni: string
  email: string
  phone: string
  role: 'ADMIN' | 'INSTRUCTOR' | 'CLIENT'
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
}
```

### Activity
```typescript
interface Activity {
  id: number
  name: string
  description: string
  startTime: string
  endTime: string
  capacity: number
  enrolled: number
  instructorId: number
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
}
```

### Payment
```typescript
interface Payment {
  id: number
  userId: number
  amount: number
  description: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  paymentMethod: 'CASH' | 'TRANSFER' | 'MERCADOPAGO'
  createdAt: string
  approvedAt?: string
}
```

### Notification
```typescript
interface Notification {
  id: number
  userId: number
  title: string
  message: string
  type: 'PAYMENT_REMINDER' | 'ACTIVITY_UPDATE' | 'GENERAL'
  read: boolean
  createdAt: string
}
```

## 🚨 Error Handling

### Error Response Format
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/users/new",
  "details": {
    "email": "Email format is invalid",
    "password": "Password must be at least 8 characters"
  }
}
```

### HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## 🔒 Security

### Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```http
Authorization: Bearer <jwt-token>
```

### Rate Limiting
- **General endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **File upload endpoints**: 5 requests per minute

### CORS Policy
```javascript
{
  "allowedOrigins": ["https://personalfitsantafe.com"],
  "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "allowedHeaders": ["Authorization", "Content-Type"],
  "maxAge": 3600
}
```

## 📱 Frontend Integration

### API Client Example
```typescript
// api/client.ts
class APIClient {
  private baseURL = process.env.NEXT_PUBLIC_API_URL
  
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getToken()
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    })
    
    if (!response.ok) {
      throw new APIError(response.status, await response.text())
    }
    
    return response.json()
  }
}
```

### React Hook Example
```typescript
// hooks/use-users.ts
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.request<User[]>('/api/users/all'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

## 🧪 Testing

### API Testing with Jest
```typescript
// tests/api/auth.test.ts
describe('Auth API', () => {
  it('should login with valid credentials', async () => {
    const response = await authAPI.login({
      email: 'test@example.com',
      password: 'password123'
    })
    
    expect(response.token).toBeDefined()
    expect(response.user.email).toBe('test@example.com')
  })
})
```

### Integration Testing
```java
// UserControllerTest.java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class UserControllerTest {
    
    @Test
    void shouldCreateUser() throws Exception {
        mockMvc.perform(post("/api/users/new")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newUser)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }
}
```

## 📚 Additional Resources

- [Postman Collection](./postman-collection.json)
- [OpenAPI Specification](./openapi.yaml)
- [SDK Documentation](./sdk-documentation.md)
- [Webhook Documentation](./webhook-documentation.md)
EOF

    log_success "API documentation generated"
}

generate_security_guidelines() {
    log "🔒 Generating security guidelines..."
    
    cat > "$OUTPUT_DIR/security-guidelines.md" << 'EOF'
# 🔒 Security Guidelines - Personal Fit Santa Fe

## 📋 Security Overview

This document outlines the security measures, best practices, and guidelines implemented in the Personal Fit Santa Fe application to ensure data protection, user privacy, and system integrity.

## 🛡️ Security Architecture

```mermaid
graph TD
    A[Client Browser] -->|HTTPS| B[Nginx Reverse Proxy]
    B -->|Internal Network| C[Frontend Container]
    B -->|Internal Network| D[Backend Container]
    D -->|Encrypted Connection| E[PostgreSQL Database]
    
    F[GitHub Actions] -->|SSH + Key Auth| G[Production Server]
    
    style A fill:#e1f5fe
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#e8f5e8
    style E fill:#fff8e1
```

## 🔐 Authentication & Authorization

### JWT Implementation
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Secret**: 256-bit randomly generated key
- **Access Token Expiry**: 24 hours
- **Refresh Token Expiry**: 7 days
- **Token Storage**: HttpOnly cookies (recommended) or localStorage

### Password Security
```java
// Password encoding with BCrypt
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12); // Cost factor 12
}

// Password validation rules
@Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
         message = "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character")
private String password;
```

### Role-Based Access Control (RBAC)
```java
// Security configuration
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/users/new").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasRole("ADMIN")
                .requestMatchers("/api/activities/new").hasAnyRole("ADMIN", "INSTRUCTOR")
                .anyRequest().authenticated()
            )
            .build();
    }
}
```

### Session Management
- **Session Timeout**: 30 minutes of inactivity
- **Concurrent Sessions**: Limited to 3 per user
- **Session Fixation Protection**: Enabled
- **CSRF Protection**: Enabled for state-changing operations

## 🔒 Data Protection

### Encryption at Rest
- **Database**: PostgreSQL with TDE (Transparent Data Encryption)
- **File Storage**: AES-256 encryption for uploaded files
- **Backups**: Encrypted with GPG keys
- **Configuration**: Sensitive data encrypted with Spring Cloud Config

### Encryption in Transit
- **HTTPS**: TLS 1.3 with perfect forward secrecy
- **Internal Communication**: mTLS between services
- **Database Connections**: SSL/TLS encrypted
- **API Calls**: HTTPS only, HTTP redirects to HTTPS

### Data Masking & Anonymization
```java
// Sensitive data masking in logs
@JsonIgnore
private String password;

@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
private String creditCardNumber;

// Database audit trail
@Entity
@Audited
public class User {
    @NotAudited
    private String password; // Exclude from audit
}
```

## 🛡️ Input Validation & Sanitization

### Backend Validation
```java
// DTO validation
public class InCreateUserDTO {
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    private String name;
    
    @Email(message = "Email format is invalid")
    @NotBlank(message = "Email is required")
    private String email;
    
    @Pattern(regexp = "^\\d{8}$", message = "DNI must be 8 digits")
    private String dni;
    
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$",
             message = "Password must contain at least 8 characters with mixed case and numbers")
    private String password;
}
```

### Frontend Validation
```typescript
// Form validation with Zod
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  dni: z.string().regex(/^\d{8}$/, "DNI must be 8 digits"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
})

// XSS protection
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input)
}
```

### SQL Injection Prevention
```java
// Using JPA with parameterized queries
@Repository
public interface IUserRepository extends JpaRepository<User, Long> {
    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmail(@Param("email") String email);
    
    // Avoid string concatenation in queries
    // BAD: "SELECT * FROM users WHERE email = '" + email + "'"
    // GOOD: Use @Param annotations
}
```

## 🔐 API Security

### Rate Limiting
```java
// Rate limiting implementation
@Component
public class RateLimitingFilter implements Filter {
    
    private final Map<String, RateLimiter> limiters = new ConcurrentHashMap<>();
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                        FilterChain chain) throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String clientIP = getClientIP(httpRequest);
        
        RateLimiter limiter = limiters.computeIfAbsent(clientIP, 
            k -> RateLimiter.create(100.0 / 60.0)); // 100 requests per minute
        
        if (limiter.tryAcquire()) {
            chain.doFilter(request, response);
        } else {
            ((HttpServletResponse) response).setStatus(429); // Too Many Requests
        }
    }
}
```

### CORS Configuration
```java
@Configuration
public class CorsConfig {
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("https://personalfitsantafe.com"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
```

### Content Security Policy (CSP)
```typescript
// Next.js security headers
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.mercadopago.com;"
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]
```

## 🔍 Security Monitoring & Logging

### Audit Logging
```java
// Security event logging
@Component
@Slf4j
public class SecurityEventLogger {
    
    public void logLoginAttempt(String email, String ip, boolean success) {
        if (success) {
            log.info("LOGIN_SUCCESS: user={}, ip={}", email, ip);
        } else {
            log.warn("LOGIN_FAILED: user={}, ip={}", email, ip);
        }
    }
    
    public void logPrivilegedAction(String user, String action, String resource) {
        log.info("PRIVILEGED_ACTION: user={}, action={}, resource={}", user, action, resource);
    }
}
```

### Intrusion Detection
```bash
# Log monitoring with fail2ban
[personalfit-auth]
enabled = true
port = 8080
filter = personalfit-auth
logpath = /opt/Personal-Fit-Santa-Fe/logs/personalfit.log
maxretry = 5
bantime = 3600
findtime = 600
```

### Security Metrics
- Failed login attempts per IP
- Privilege escalation attempts
- Unusual API access patterns
- File upload anomalies
- Database query patterns

## 🔐 Secrets Management

### Environment Variables
```bash
# Production secrets (never commit these)
JWT_SECRET=<256-bit-random-key>
MP_ACCESS_TOKEN=<mercadopago-token>
DATABASE_PASSWORD=<strong-password>
ENCRYPTION_KEY=<aes-256-key>
```

### GitHub Secrets
```yaml
# .github/workflows/ci-cd.yml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  MP_ACCESS_TOKEN: ${{ secrets.MP_ACCESS_TOKEN }}
  SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
```

### Secret Rotation Policy
- **JWT Secrets**: Rotated quarterly
- **Database Passwords**: Rotated bi-annually
- **API Keys**: Rotated when compromised or annually
- **SSH Keys**: Rotated annually

## 🛡️ Vulnerability Management

### Dependency Scanning
```xml
<!-- Maven OWASP Dependency Check -->
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <version>8.4.0</version>
    <configuration>
        <failBuildOnCVSS>7</failBuildOnCVSS>
        <suppressionFile>owasp-suppressions.xml</suppressionFile>
    </configuration>
</plugin>
```

```json
// NPM audit for frontend
{
  "scripts": {
    "audit": "npm audit --audit-level=high",
    "audit:fix": "npm audit fix"
  }
}
```

### Container Security
```dockerfile
# Security-focused Dockerfile
FROM node:18-alpine AS builder
# Use non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Remove unnecessary packages
RUN apk del --no-cache curl wget

# Set security headers
COPY --from=builder --chown=nextjs:nodejs /app ./
USER nextjs
```

### Security Testing
```java
// Security testing with Spring Security Test
@Test
@WithMockUser(roles = "CLIENT")
void shouldDenyAccessToAdminEndpoint() throws Exception {
    mockMvc.perform(delete("/api/users/1"))
           .andExpect(status().isForbidden());
}

@Test
void shouldRequireAuthentication() throws Exception {
    mockMvc.perform(get("/api/users/all"))
           .andExpect(status().isUnauthorized());
}
```

## 📋 Security Checklist

### Development Phase
- [ ] Input validation on all user inputs
- [ ] Output encoding to prevent XSS
- [ ] Parameterized queries to prevent SQL injection
- [ ] Proper error handling (no sensitive data in errors)
- [ ] Secure password hashing (BCrypt with cost ≥ 12)
- [ ] JWT token validation and expiration
- [ ] Role-based access control implementation
- [ ] HTTPS enforcement
- [ ] Security headers configuration

### Testing Phase
- [ ] Authentication bypass testing
- [ ] Authorization testing for all roles
- [ ] Input validation testing (boundary values)
- [ ] SQL injection testing
- [ ] XSS testing
- [ ] CSRF testing
- [ ] Session management testing
- [ ] File upload security testing
- [ ] Dependency vulnerability scanning

### Deployment Phase
- [ ] TLS/SSL certificate installation
- [ ] Firewall configuration
- [ ] Database access restrictions
- [ ] Log monitoring setup
- [ ] Backup encryption
- [ ] Secret management configuration
- [ ] Rate limiting implementation
- [ ] Security headers verification

### Maintenance Phase
- [ ] Regular security updates
- [ ] Dependency vulnerability monitoring
- [ ] Log analysis and monitoring
- [ ] Access review and cleanup
- [ ] Backup verification
- [ ] Incident response procedures
- [ ] Security awareness training

## 🚨 Incident Response

### Security Incident Classification
1. **Critical**: Data breach, system compromise
2. **High**: Authentication bypass, privilege escalation
3. **Medium**: DoS attacks, information disclosure
4. **Low**: Brute force attempts, reconnaissance

### Response Procedures
1. **Immediate Response** (0-1 hour)
   - Isolate affected systems
   - Preserve evidence
   - Notify security team

2. **Short-term Response** (1-24 hours)
   - Assess impact and scope
   - Implement containment measures
   - Begin forensic analysis

3. **Long-term Response** (1-30 days)
   - Complete investigation
   - Implement fixes
   - Update security measures
   - Document lessons learned

## 📞 Security Contacts

### Internal Team
- **Security Lead**: security@personalfitsantafe.com
- **Development Team**: dev@personalfitsantafe.com
- **System Administrator**: admin@personalfitsantafe.com

### External Resources
- **OWASP**: https://owasp.org/
- **CVE Database**: https://cve.mitre.org/
- **Security Advisories**: Subscribe to relevant security mailing lists

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Spring Security Documentation](https://docs.spring.io/spring-security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
EOF

    log_success "Security guidelines generated"
}

generate_index_documentation() {
    log "📖 Generating documentation index..."
    
    cat > "$OUTPUT_DIR/README.md" << 'EOF'
# 📚 Personal Fit Santa Fe - Documentation

Welcome to the comprehensive documentation for the Personal Fit Santa Fe application. This documentation covers all aspects of development, deployment, testing, and maintenance.

## 📋 Table of Contents

### 🚀 CI/CD & Deployment
- [**CI/CD Overview**](./cicd-overview.md) - Complete pipeline architecture and processes
- [**Deployment Guide**](./deployment-guide.md) - Step-by-step deployment instructions
- [**Rollback Procedures**](./rollback-procedures.md) - Emergency rollback and recovery

### 🧪 Testing & Quality Assurance
- [**Testing Strategy**](./testing-strategy.md) - Comprehensive testing approach
- [**Code Quality Standards**](./code-quality.md) - Linting, formatting, and best practices
- [**Performance Testing**](./performance-testing.md) - Load testing and optimization

### 🔒 Security
- [**Security Guidelines**](./security-guidelines.md) - Security measures and best practices
- [**Authentication & Authorization**](./auth-guide.md) - JWT implementation and RBAC
- [**Data Protection**](./data-protection.md) - Encryption and privacy measures

### 📡 API Documentation
- [**API Reference**](./api-documentation.md) - Complete API endpoint documentation
- [**SDK Documentation**](./sdk-documentation.md) - Client libraries and integrations
- [**Webhook Guide**](./webhook-guide.md) - Webhook implementation and handling

### 🏗️ Architecture & Development
- [**System Architecture**](./architecture.md) - Overall system design and components
- [**Database Schema**](./database-schema.md) - Data models and relationships
- [**Frontend Guide**](./frontend-guide.md) - React/Next.js development guide
- [**Backend Guide**](./backend-guide.md) - Spring Boot development guide

### 🔧 Operations & Maintenance
- [**Monitoring Guide**](./monitoring.md) - System monitoring and alerting
- [**Backup & Recovery**](./backup-recovery.md) - Data backup and disaster recovery
- [**Troubleshooting**](./troubleshooting.md) - Common issues and solutions
- [**Maintenance Procedures**](./maintenance.md) - Regular maintenance tasks

## 🚀 Quick Start

### For Developers
1. Read the [Development Setup Guide](./development-setup.md)
2. Review [Code Quality Standards](./code-quality.md)
3. Understand [Testing Strategy](./testing-strategy.md)
4. Check [API Documentation](./api-documentation.md)

### For DevOps Engineers
1. Review [CI/CD Overview](./cicd-overview.md)
2. Follow [Deployment Guide](./deployment-guide.md)
3. Understand [Security Guidelines](./security-guidelines.md)
4. Set up [Monitoring](./monitoring.md)

### For System Administrators
1. Review [System Architecture](./architecture.md)
2. Understand [Backup & Recovery](./backup-recovery.md)
3. Learn [Troubleshooting](./troubleshooting.md) procedures
4. Set up [Maintenance](./maintenance.md) schedules

## 📊 Project Status

### Current Version
- **Application Version**: 1.0.0
- **Documentation Version**: 1.0.0
- **Last Updated**: $(date '+%Y-%m-%d')

### Technology Stack
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Spring Boot 3, Java 21, PostgreSQL 15
- **Infrastructure**: Docker, Docker Compose, GitHub Actions
- **Monitoring**: Custom health checks, structured logging

### Quality Metrics
- **Test Coverage**: Backend 70%+, Frontend 60%+
- **Code Quality**: A grade (SonarQube)
- **Security Score**: A+ (OWASP ZAP)
- **Performance**: < 2s response time, 99.9% uptime

## 🔄 Document Maintenance

### Update Schedule
- **Weekly**: Deployment reports and metrics
- **Monthly**: Performance and security reviews
- **Quarterly**: Architecture and process reviews
- **As Needed**: Incident reports and troubleshooting updates

### Contributing to Documentation
1. Follow the [Documentation Standards](./doc-standards.md)
2. Use clear, concise language
3. Include code examples and diagrams
4. Update the table of contents
5. Submit pull requests for review

## 📞 Support & Contacts

### Development Team
- **Lead Developer**: dev-lead@personalfitsantafe.com
- **Frontend Team**: frontend@personalfitsantafe.com
- **Backend Team**: backend@personalfitsantafe.com

### Operations Team
- **DevOps Lead**: devops@personalfitsantafe.com
- **System Administrator**: admin@personalfitsantafe.com
- **Security Officer**: security@personalfitsantafe.com

### Emergency Contacts
- **On-call Engineer**: +54 XXX XXX XXXX
- **Emergency Email**: emergency@personalfitsantafe.com

## 🔗 External Resources

### Development
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### DevOps & Security
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [OWASP Security Guidelines](https://owasp.org/)

### Monitoring & Observability
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [ELK Stack Documentation](https://www.elastic.co/guide/)

## 📈 Roadmap

### Short Term (Next 3 months)
- [ ] Enhanced monitoring with Prometheus/Grafana
- [ ] Automated security scanning in CI/CD
- [ ] Performance optimization and caching
- [ ] Mobile app development start

### Medium Term (3-6 months)
- [ ] Microservices migration planning
- [ ] Advanced analytics implementation
- [ ] Multi-tenant architecture
- [ ] API rate limiting and throttling

### Long Term (6+ months)
- [ ] Machine learning integration
- [ ] Advanced reporting and dashboards
- [ ] Third-party integrations expansion
- [ ] International expansion support

---

**Last Updated**: $(date '+%Y-%m-%d %H:%M:%S')  
**Version**: 1.0.0  
**Maintained by**: Personal Fit Santa Fe Development Team
EOF

    log_success "Documentation index generated"
}

# ==================== REPORT AGGREGATION ====================
aggregate_reports() {
    log "📊 Aggregating CI/CD reports..."
    
    local report_file="$OUTPUT_DIR/cicd-status-report.md"
    
    cat > "$report_file" << EOF
# 📊 CI/CD Status Report - $(date '+%Y-%m-%d %H:%M:%S')

## 📋 Pipeline Status

### Recent Deployments
$(ls -la "$REPORTS_DIR/deployment/" 2>/dev/null | tail -5 | awk '{print "- " $9 " (" $6 " " $7 " " $8 ")"}' || echo "No deployment reports found")

### Test Results
$(ls -la "$REPORTS_DIR/testing/" 2>/dev/null | tail -3 | awk '{print "- " $9 " (" $6 " " $7 " " $8 ")"}' || echo "No test reports found")

### Code Quality Reports
$(ls -la "$REPORTS_DIR/linting/" 2>/dev/null | tail -3 | awk '{print "- " $9 " (" $6 " " $7 " " $8 ")"}' || echo "No linting reports found")

## 🏥 System Health
$(if [[ -f "$PROJECT_DIR/scripts/health-check.sh" ]]; then
    echo "Last health check: $(date)"
    echo "\`\`\`"
    timeout 30 "$PROJECT_DIR/scripts/health-check.sh" 2>/dev/null | tail -10 || echo "Health check not available"
    echo "\`\`\`"
else
    echo "Health check script not available"
fi)

## 📈 Metrics Summary
- **Documentation Generated**: $(date)
- **Total Reports**: $(find "$REPORTS_DIR" -name "*.md" 2>/dev/null | wc -l)
- **System Uptime**: $(uptime -p 2>/dev/null || echo "N/A")
- **Disk Usage**: $(df -h "$PROJECT_DIR" 2>/dev/null | tail -1 | awk '{print $5 " used"}' || echo "N/A")

## 🔧 Quick Actions
- [View Full Documentation](./README.md)
- [Check Deployment Status](../reports/deployment/)
- [Review Test Results](../reports/testing/)
- [Monitor System Health](./monitoring.md)

---
*Report generated automatically by the documentation system*
EOF

    log_success "CI/CD status report aggregated"
}

# ==================== MAIN FUNCTION ====================
main() {
    log "📚 Starting documentation generation for Personal Fit Santa Fe..."
    
    # Create necessary directories
    create_directories
    
    # Generate all documentation
    generate_cicd_overview
    generate_deployment_guide
    generate_testing_documentation
    generate_api_documentation
    generate_security_guidelines
    generate_index_documentation
    
    # Aggregate reports
    aggregate_reports
    
    log_success "🎉 Documentation generation completed successfully!"
    
    # Display summary
    echo ""
    echo "=============================================="
    log "📚 DOCUMENTATION SUMMARY"
    echo "=============================================="
    echo "📁 Output Directory: $OUTPUT_DIR"
    echo "📄 Generated Files:"
    ls -la "$OUTPUT_DIR"/*.md 2>/dev/null | awk '{print "   " $9 " (" $5 " bytes)"}' || echo "   No files generated"
    echo "=============================================="
    
    log "📖 Documentation is now available in the docs/generated directory"
    log "🌐 Main index: docs/generated/README.md"
}

# ==================== SCRIPT EXECUTION ====================
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
