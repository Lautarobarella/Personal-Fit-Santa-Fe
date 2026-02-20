"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { CheckCircle, Info, Loader2, XCircle } from "lucide-react"
import { useState } from "react"

interface EndpointStatus {
  name: string
  url: string
  status: "loading" | "success" | "error"
  error?: string
  responseTime?: number
}

export default function DiagnosticsPage() {
  // Use custom hook to redirect to login if not authenticated
  useRequireAuth()

  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const endpointsToTest = [
    { name: "Health Check", url: "/api/health" },
    { name: "Payments API", url: "/api/payments/getAll" },
    { name: "Revenue History", url: "/api/payments/revenue/history" },
  ]

  const checkEndpoint = async (endpoint: { name: string; url: string }): Promise<EndpointStatus> => {
    const startTime = Date.now()

    try {
      const response = await fetch(endpoint.url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const responseTime = Date.now() - startTime

      if (response.ok) {
        return {
          name: endpoint.name,
          url: endpoint.url,
          status: "success",
          responseTime,
        }
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

    for (const endpoint of endpointsToTest) {
      const result = await checkEndpoint(endpoint)
      results.push(result)
      setEndpoints([...results])
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: EndpointStatus["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
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
    if (!time) {
      return "N/A"
    }
    return `${time}ms`
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Diagnosticos" showBack />

      <div className="container py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Diagnosticos del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runDiagnostics} disabled={isRunning} className="w-full">
              {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ejecutar Diagnosticos
            </Button>

            {endpoints.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Estado de Endpoints</h3>
                {endpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(endpoint.status)}
                      <div>
                        <p className="font-medium">{endpoint.name}</p>
                        <p className="text-sm text-gray-500">{endpoint.url}</p>
                        {endpoint.error && <p className="text-sm text-red-600">{endpoint.error}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(endpoint.status)}>{endpoint.status}</Badge>
                      <p className="text-xs text-gray-500 mt-1">{formatResponseTime(endpoint.responseTime)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

