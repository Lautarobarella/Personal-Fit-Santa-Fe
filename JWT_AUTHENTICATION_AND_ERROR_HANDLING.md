# JWT Authentication and Error Handling Implementation

## Overview

This document describes the implementation of JWT (JSON Web Token) authentication and integrated error handling for the Personal Fit Santa Fe application. The implementation provides a professional, secure, and user-friendly authentication system with comprehensive error management.

## Backend Implementation

### 1. Global Exception Handler

**File**: `Backend/src/main/java/com/personalfit/personalfit/controllers/GlobalExceptionHandler.java`

The global exception handler provides consistent error responses across all endpoints:

- **Authentication Errors**: Handles `AuthenticationException` and `BadCredentialsException`
- **Resource Not Found**: Handles various "No X with Y" exceptions
- **Validation Errors**: Handles `MethodArgumentNotValidException` with field-specific errors
- **File Upload Errors**: Handles file size and extension validation
- **Generic Errors**: Catches all other exceptions

**Key Features**:
- Structured error responses using `ErrorDTO`
- HTTP status codes mapped to appropriate error types
- Spanish error messages for user-friendly experience
- Detailed logging for debugging

### 2. Error DTO Structure

**File**: `Backend/src/main/java/com/personalfit/personalfit/dto/ErrorDTO.java`

```java
@Builder
public class ErrorDTO {
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
    private String path;
    private Map<String, String> details; // For validation errors
}
```

### 3. Security Configuration

**File**: `Backend/src/main/java/com/personalfit/personalfit/config/SecurityConfig.java`

- JWT-based authentication
- Stateless session management
- CORS configuration for frontend integration
- Public endpoints: `/api/auth/**`, `/api/public/**`
- All other endpoints require authentication

## Frontend Implementation

### 1. API Client with JWT Support

**File**: `Frontend/lib/api.ts`

**Key Features**:
- Automatic JWT token inclusion in requests
- Token refresh on 401 responses
- Structured error handling with `ApiError` class
- Support for both authenticated and public endpoints

**ApiError Class**:
```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public error: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
```

### 2. Authentication Management

**File**: `Frontend/lib/auth.ts`

**Features**:
- Secure token storage (localStorage for development)
- Automatic token refresh
- User session management
- Permission-based access control

**Security Notes**:
- TODO: Implement secure token storage for production (HTTPS cookies)
- Current implementation uses localStorage for development

### 3. Error Handling Utilities

**File**: `Frontend/lib/error-handler.ts`

**Functions**:
- `handleApiError()`: Generic error handler with toast notifications
- `handleValidationError()`: Field-specific validation error display
- `isValidationError()`: Type guard for validation errors
- `isAuthError()`: Type guard for authentication errors

**Error Categories**:
- **401**: Authentication errors (session expired, invalid credentials)
- **403**: Authorization errors (insufficient permissions)
- **404**: Resource not found
- **409**: Conflict errors (duplicate resources)
- **422**: Validation errors (invalid input data)
- **500**: Server errors

### 4. API Endpoints with Error Handling

All API modules have been updated to use the new error handling system:

- **Activities API**: `Frontend/api/activities/activitiesApi.ts`
- **Users API**: `Frontend/api/clients/usersApi.ts`
- **Payments API**: `Frontend/api/payment/paymentsApi.ts`
- **Notifications API**: `Frontend/api/notifications/notificationsApi.ts`

## Authentication Flow

### 1. Login Process

1. User submits credentials via login form
2. Frontend calls `/api/auth/login` endpoint
3. Backend validates credentials and returns JWT tokens
4. Frontend stores tokens and user information
5. User is redirected to dashboard

### 2. Token Management

- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens
- **Automatic Refresh**: When API returns 401, frontend automatically refreshes token

### 3. Logout Process

1. User clicks logout
2. Frontend clears stored tokens and user data
3. User is redirected to login page

## Error Handling Flow

### 1. Backend Error Generation

1. Exception occurs in service layer
2. Global exception handler catches the exception
3. Error is converted to structured `ErrorDTO`
4. Response is sent with appropriate HTTP status code

### 2. Frontend Error Processing

1. API client receives error response
2. Error is parsed and converted to `ApiError` instance
3. Error handler determines appropriate user message
4. Toast notification is displayed to user

### 3. User Experience

- **Toast Notifications**: Immediate feedback for all errors
- **Field Validation**: Specific error messages for form fields
- **Session Management**: Automatic redirect on authentication errors
- **Retry Logic**: Automatic token refresh for expired sessions

## Security Features

### 1. JWT Security

- **Token Expiration**: Short-lived access tokens
- **Refresh Mechanism**: Secure token refresh process
- **Stateless**: No server-side session storage
- **CORS Protection**: Proper CORS configuration

### 2. Error Security

- **No Sensitive Data**: Error messages don't expose internal details
- **Structured Logging**: Detailed logs for debugging without exposing data
- **Input Validation**: Comprehensive validation on all endpoints

## Usage Examples

### 1. Making Authenticated API Calls

```typescript
import { apiClient } from '@/lib/api'

// Automatic JWT inclusion
const activities = await apiClient.get('/api/activities/getAll')
```

### 2. Handling Errors in Components

```typescript
import { handleApiError } from '@/lib/error-handler'

try {
  const result = await someApiCall()
} catch (error) {
  handleApiError(error, 'Error message')
}
```

### 3. Form Validation Errors

```typescript
import { handleValidationError, isValidationError } from '@/lib/error-handler'

try {
  await createUser(userData)
} catch (error) {
  if (isValidationError(error)) {
    handleValidationError(error)
  } else {
    handleApiError(error, 'Error creating user')
  }
}
```

## Testing

### 1. Authentication Testing

- Test with valid credentials
- Test with invalid credentials
- Test token expiration
- Test token refresh

### 2. Error Handling Testing

- Test 401 responses (authentication)
- Test 403 responses (authorization)
- Test 404 responses (not found)
- Test 422 responses (validation)
- Test 500 responses (server error)

## Deployment Considerations

### 1. Production Security

- Implement secure token storage (HTTPS cookies)
- Use environment variables for JWT secrets
- Enable HTTPS in production
- Configure proper CORS origins

### 2. Monitoring

- Log authentication attempts
- Monitor token refresh patterns
- Track error rates by type
- Set up alerts for security events

## Future Enhancements

1. **Rate Limiting**: Implement rate limiting for authentication endpoints
2. **Multi-factor Authentication**: Add 2FA support
3. **Session Management**: Add ability to revoke sessions
4. **Audit Logging**: Comprehensive audit trail for security events
5. **Advanced Error Analytics**: Track and analyze error patterns

## Conclusion

This implementation provides a robust, secure, and user-friendly authentication system with comprehensive error handling. The system is designed to be maintainable, scalable, and follows security best practices while providing an excellent user experience. 