import { getAccessToken, refreshAccessToken } from './auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface ApiOptions {
  method?: string
  headers?: Record<string, string>
  body?: any
  requireAuth?: boolean
}

class ApiClient {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = getAccessToken()
    if (!token) {
      throw new Error('No access token available')
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
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
      throw new Error(`HTTP error! status: ${response.status}`)
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

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
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
      config.body = JSON.stringify(body)
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

export const apiClient = new ApiClient() 