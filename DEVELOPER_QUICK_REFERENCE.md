# Developer Quick Reference - JWT & Error Handling

## Quick Start

### 1. Making API Calls

```typescript
import { apiClient } from '@/lib/api'

// GET request with automatic JWT
const data = await apiClient.get('/api/endpoint')

// POST request with data
const result = await apiClient.post('/api/endpoint', data)

// PUT request
await apiClient.put('/api/endpoint', data)

// DELETE request
await apiClient.delete('/api/endpoint')
```

### 2. Error Handling in Components

```typescript
import { handleApiError, isValidationError, handleValidationError } from '@/lib/error-handler'

try {
  const result = await apiCall()
} catch (error) {
  if (isValidationError(error)) {
    handleValidationError(error) // Shows field-specific errors
  } else {
    handleApiError(error, 'Custom error message')
  }
}
```

### 3. Authentication in Components

```typescript
import { useAuth } from '@/components/providers/auth-provider'

const { user, login, logout, loading } = useAuth()

// Check if user is authenticated
if (!user) {
  // Redirect to login
}

// Get user role
const userRole = user?.role
```

## Error Types

| Status | Error Type | Description |
|--------|------------|-------------|
| 401 | Authentication | Invalid credentials, expired token |
| 403 | Authorization | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 422 | Validation | Invalid input data |
| 500 | Server Error | Internal server error |

## Common Patterns

### 1. Form Submission with Validation

```typescript
const handleSubmit = async (formData: FormData) => {
  try {
    await apiClient.post('/api/endpoint', formData)
    toast({
      title: "Éxito",
      description: "Operación completada",
      variant: "default",
    })
  } catch (error) {
    if (isValidationError(error)) {
      handleValidationError(error)
    } else {
      handleApiError(error, 'Error al procesar la solicitud')
    }
  }
}
```

### 2. Data Fetching with Error Handling

```typescript
const fetchData = async () => {
  try {
    const data = await apiClient.get('/api/endpoint')
    setData(data)
  } catch (error) {
    handleApiError(error, 'Error al cargar los datos')
    setData([]) // Fallback to empty array
  }
}
```

### 3. Conditional Rendering Based on Auth

```typescript
const { user, loading } = useAuth()

if (loading) {
  return <LoadingSpinner />
}

if (!user) {
  return <LoginForm />
}

return <ProtectedContent />
```

## Backend Error Handling

### 1. Throwing Custom Exceptions

```java
// In service layer
if (user == null) {
    throw new NoUserWithIdException(id.toString());
}

if (userExists) {
    throw new UserDniAlreadyExistsException(dni);
}
```

### 2. Validation in Controllers

```java
@PostMapping("/create")
public ResponseEntity<ResponseDTO> create(@Valid @RequestBody RequestDTO request) {
    // Validation errors automatically handled by GlobalExceptionHandler
    return ResponseEntity.ok(service.create(request));
}
```

## Security Best Practices

### 1. Token Storage (Development)

```typescript
// Current implementation (development)
localStorage.setItem('accessToken', token)

// TODO: Production implementation
// Use HTTP-only cookies with secure flag
```

### 2. Permission Checking

```typescript
import { hasPermission } from '@/lib/auth'

const canEdit = hasPermission(userRole, 'trainer')
const canDelete = hasPermission(userRole, 'admin')
```

## Testing

### 1. Test Authentication

```typescript
// Test valid login
const success = await login('valid@email.com', 'password')
expect(success).toBe(true)

// Test invalid login
try {
  await login('invalid@email.com', 'wrongpassword')
} catch (error) {
  expect(error.message).toContain('Credenciales incorrectas')
}
```

### 2. Test Error Handling

```typescript
// Test API error
try {
  await apiClient.get('/api/nonexistent')
} catch (error) {
  expect(error.status).toBe(404)
  expect(error.message).toContain('No encontrado')
}
```

## Environment Variables

```bash
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8080

# Backend
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

## Common Issues & Solutions

### 1. Token Expired

**Problem**: 401 errors after some time
**Solution**: Automatic token refresh is handled by `apiClient`

### 2. CORS Errors

**Problem**: Cross-origin requests blocked
**Solution**: Backend CORS configuration in `SecurityConfig.java`

### 3. Validation Errors Not Showing

**Problem**: Field errors not displayed
**Solution**: Use `handleValidationError()` for 422 responses

### 4. Authentication State Lost

**Problem**: User logged out unexpectedly
**Solution**: Check token storage and refresh mechanism

## Debugging

### 1. Check Network Tab

- Look for 401 responses (authentication issues)
- Check request headers for Authorization token
- Verify response format matches ErrorDTO

### 2. Console Logs

```typescript
// Enable debug logging
console.log('API Error:', error)
console.log('User:', user)
console.log('Token:', getAccessToken())
```

### 3. Backend Logs

```java
// Check application logs for exceptions
log.error("Authentication failed for user: {}", email, e);
```

## Performance Tips

1. **Token Refresh**: Only refresh when needed (401 response)
2. **Error Caching**: Don't cache error responses
3. **Request Batching**: Group related API calls
4. **Lazy Loading**: Load data only when needed

## Migration Guide

### From Old API Calls

```typescript
// Old way
const response = await fetch('/api/endpoint')
if (!response.ok) {
  throw new Error('API Error')
}

// New way
const data = await apiClient.get('/api/endpoint')
// Error handling is automatic
```

### From Manual Error Handling

```typescript
// Old way
try {
  const data = await apiCall()
} catch (error) {
  console.error(error)
  // Manual error display
}

// New way
try {
  const data = await apiCall()
} catch (error) {
  handleApiError(error, 'User-friendly message')
}
``` 