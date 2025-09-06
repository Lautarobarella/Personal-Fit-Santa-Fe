import { refreshAccessToken } from '../../lib/auth';
import { API_CONFIG } from './config';

// Custom error class for API errors
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

interface ApiOptions {
  method?: string
  headers?: Record<string, string>
  body?: any
  requireAuth?: boolean
}

class JWTPermissionsApi {

  private async handleResponse(response: Response): Promise<any> {
    if (response.status === 401) {
      // Token expired, try to refresh
      const newToken = await refreshAccessToken()
      if (!newToken) {
        throw new Error('Authentication failed')
      }
      throw new Error('Authentication failed - please try again')
    }

    if (!response.ok) {
      // Try to parse error response from backend
      try {
        const errorData = await response.json()
        throw new ApiError(
          errorData.message || 'Error desconocido',
          response.status,
          errorData.error || 'Error',
          errorData.details
        )
      } catch (parseError) {
        // If we can't parse the error response, throw a generic error
        throw new ApiError(
          `Error ${response.status}: ${response.statusText}`,
          response.status,
          'Error',
          undefined
        )
      }
    }

    // Check if response has content before trying to parse JSON
    const contentType = response.headers.get('content-type')
    const contentLength = response.headers.get('content-length')
    
    // If no content or empty response, return null (for backward compatibility)
    if (contentLength === '0' || !contentType || !contentType.includes('application/json')) {
      return null
    }

    // Try to parse JSON, but handle empty responses gracefully
    try {
      const text = await response.text()
      return text ? JSON.parse(text) : null
    } catch (parseError) {
      // If parsing fails, return null (for backward compatibility)
      return null
    }
  }

  async request(endpoint: string, options: ApiOptions = {}): Promise<any> {
    const {
      method = 'GET',
      headers = {},
      body,
      requireAuth = true,
    } = options

    const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BACKEND_URL}${endpoint}`
    const requestHeaders: Record<string, string> = {
      ...headers,
    }

    if (!(body instanceof FormData)) {
      requestHeaders['Content-Type'] = 'application/json'
    }
    const config: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: 'include',
    }

    if (body) {
      config.body = body instanceof FormData ? body : JSON.stringify(body)
    }

    try {
      const response = await fetch(url, config)
      return await this.handleResponse(response)
    } catch (error) {
      throw error
    }
  }

  // Convenience methods
  async get(endpoint: string, requireAuth = true): Promise<any> {
    return this.request(endpoint, { method: 'GET', requireAuth })
  }

  async post(endpoint: string, body: any, requireAuth = true): Promise<any> {
    return this.request(endpoint, { method: 'POST', body, requireAuth })
  }

  async put(endpoint: string, body: any, requireAuth = true): Promise<any> {
    return this.request(endpoint, { method: 'PUT', body, requireAuth })
  }

  async delete(endpoint: string, requireAuth = true): Promise<any> {
    return this.request(endpoint, { method: 'DELETE', requireAuth })
  }
}

export const jwtPermissionsApi = new JWTPermissionsApi() 