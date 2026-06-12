"use client"

import { useDiagnostics } from "@/hooks/admin/use-diagnostics"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
        return <CheckCircle className="size-4 text-green-600" />
      case "error":
        return <XCircle className="size-4 text-destructive" />
      default:
        return <Info className="size-4 text-muted-foreground" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Diagnósticos" showBack />

      <div className="container py-6 space-y-6">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-primary" />
            <h3 className="text-base font-semibold">Diagnósticos del Sistema</h3>
          </div>
          <div className="space-y-4 rounded-xl border p-4">
            <Button onClick={runDiagnostics} disabled={isRunning} className="w-full">
              {isRunning && <Loader2 className="mr-2 size-4 animate-spin" />}
              Ejecutar Diagnósticos
            </Button>

            {endpoints.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Estado de Endpoints</h3>
                {endpoints.map((endpoint) => (
                  <div key={endpoint.url} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {getStatusIcon(endpoint.status)}
                      <div className="min-w-0">
                        <p className="font-medium">{endpoint.name}</p>
                        <p className="break-all text-sm text-muted-foreground">{endpoint.url}</p>
                        {endpoint.error && <p className="text-sm text-destructive">{endpoint.error}</p>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge className={getStatusColor(endpoint.status)}>{endpoint.status}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{formatResponseTime(endpoint.responseTime)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
