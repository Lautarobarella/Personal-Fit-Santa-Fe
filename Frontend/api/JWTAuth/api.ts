import { getAccessToken, refreshAccessToken } from '../../lib/auth';
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
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = getAccessToken()
    if (!token) {
      throw new Error('No access token available')
    }
    return {
      'Authorization': `Bearer ${token}`,
    }
  }

  private async handleResponse(response: Response): Promise<any> {
    if (response.status === 401) {
      // Token expired, try to refresh
      const newToken = await refreshAccessToken()
      if (!newToken) {
        throw new Error('Authentication failed')
      }
      // Retry the request with new token
      return this.request(response.url, {
        method: response.url.includes('refresh') ? 'POST' : 'GET',
        requireAuth: true,
      })
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

    return response.json()
  }

  async request(endpoint: string, options: ApiOptions = {}): Promise<any> {
    const {
      method = 'GET',
      headers = {},
      body,
      requireAuth = true,
    } = options

    const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`
    console.log("URL: ", url)
    const requestHeaders: Record<string, string> = {
      ...headers,
    }

    // Solo establecer Content-Type si no es FormData
    if (!(body instanceof FormData)) {
      requestHeaders['Content-Type'] = 'application/json'
    }

    if (requireAuth) {
      try {
        const authHeaders = await this.getAuthHeaders()
        Object.assign(requestHeaders, authHeaders)
      } catch (error) {
        console.error('Failed to get auth headers:', error)
        throw new Error('Authentication required')
      }
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    }

    if (body) {
      // Si es FormData, enviarlo directamente, sino JSON.stringify
      config.body = body instanceof FormData ? body : JSON.stringify(body)
    }

    try {
      const response = await fetch(url, config)
      return await this.handleResponse(response)
    } catch (error) {
      console.error('API request failed:', error)
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