"use client"

import { useState } from "react"
import { useRequireAuth } from "@/hooks/use-require-auth"

interface EndpointStatus {
  name: string
  url: string
  status: "loading" | "success" | "error"
  error?: string
  responseTime?: number
}

const ENDPOINTS_TO_TEST = [
  { name: "Health Check", url: "/api/health" },
  { name: "Payments API", url: "/api/payments/getAll" },
  { name: "Revenue History", url: "/api/payments/revenue/history" },
]

export function useDiagnostics() {
  useRequireAuth()

  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const checkEndpoint = async (endpoint: { name: string; url: string }): Promise<EndpointStatus> => {
    const startTime = Date.now()

    try {
      const response = await fetch(endpoint.url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      const responseTime = Date.now() - startTime

      if (response.ok) {
        return { name: endpoint.name, url: endpoint.url, status: "success", responseTime }
      }

      return {
        name: endpoint.name,
        url: endpoint.url,
        status: "error",
        error: `HTTP ${response.status}`,
        responseTime,
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        name: endpoint.name,
        url: endpoint.url,
        status: "error",
        error: error instanceof Error ? error.message : "Error de conexion",
        responseTime,
      }
    }
  }

  const runDiagnostics = async () => {
    setIsRunning(true)
    setEndpoints([])

    const results: EndpointStatus[] = []

    for (const endpoint of ENDPOINTS_TO_TEST) {
      const result = await checkEndpoint(endpoint)
      results.push(result)
      setEndpoints([...results])
    }

    setIsRunning(false)
  }

  const getStatusColor = (status: EndpointStatus["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatResponseTime = (time?: number) => {
    if (!time) return "N/A"
    return `${time}ms`
  }

  return {
    endpoints,
    isRunning,
    runDiagnostics,
    getStatusColor,
    formatResponseTime,
  }
}
