"use client"

import { useDiagnostics } from "@/hooks/admin/use-diagnostics"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { CheckCircle, Info, Loader2, XCircle } from "lucide-react"

export default function DiagnosticsPage() {
  const {
    endpoints,
    isRunning,
    runDiagnostics,
    getStatusColor,
    formatResponseTime,
  } = useDiagnostics()

  const getStatusIcon = (status: "loading" | "success" | "error") => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
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

