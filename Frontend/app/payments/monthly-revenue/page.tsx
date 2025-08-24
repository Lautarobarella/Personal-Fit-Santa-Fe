"use client"

import { useAuth } from "@/contexts/auth-provider"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MobileHeader } from "@/components/ui/mobile-header"
import { useMonthlyRevenue } from "@/hooks/settings/use-monthly-revenue"
import { usePayment } from "@/hooks/payments/use-payment"
import { UserRole } from "@/lib/types"
import { BarChart3, Calendar, DollarSign, Eye, EyeOff, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function MonthlyRevenuePage() {
    const { user } = useAuth()
    const router = useRouter()
    const [showAmounts, setShowAmounts] = useState(true)

    // Funciones de utilidad
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat("es-AR", {
            style: "decimal",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)
    }

    const formatDate = (date: Date | string | null) => {
        if (!date) return ""
        return new Intl.DateTimeFormat("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(new Date(date))
    }

    // Solo permitir acceso a administradores
    useEffect(() => {
        if (user && user.role !== UserRole.ADMIN) {
            router.push("/dashboard")
            return
        }
    }, [user, router])

    // Obtener datos optimizados
    const { archivedRevenues, isLoading: isLoadingArchived } = useMonthlyRevenue(
        user?.role === UserRole.ADMIN
    )

    // Obtener pagos y el ingreso del mes actual calculado desde los payments existentes
    const { payments, currentMonthRevenue, isLoading: isLoadingPayments } = usePayment(undefined, true)

    if (!user || user.role !== UserRole.ADMIN) {
        return null
    }

    // Estados de carga combinados
    const isLoading = isLoadingArchived || isLoadingPayments

    // Usar el ingreso del mes actual calculado desde usePayment
    const currentMonthAmount = currentMonthRevenue.amount



    // Combinar datos reales con mock para demostración
    const displayRevenues = archivedRevenues.length > 0 ? archivedRevenues : []

    // Calcular total acumulado simple
    const totalRevenue = displayRevenues.reduce((sum, rev) => sum + rev.totalRevenue, 0) + currentMonthAmount

    // Obtener nombre del mes actual
    const currentMonthName = new Date().toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric'
    })

    const handleBack = () => {
        router.push("/settings")
    }

    return (
        <div className="min-h-screen bg-background pb-32">
            <MobileHeader
                title="Registro de Ingresos"
                showBack
                onBack={handleBack}
            />

            <div className="container-centered py-6 space-y-6">
                {/* Header simple */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                <span>Resumen de Ingresos</span>
                            </div>
                            <button
                                onClick={() => setShowAmounts(!showAmounts)}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                                aria-label={showAmounts ? "Ocultar montos" : "Mostrar montos"}
                            >
                                {showAmounts ? (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-1">Total Acumulado</p>
                            <p className="text-2xl font-bold text-primary">
                                {showAmounts ? formatCurrency(totalRevenue) : "••••••••"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {displayRevenues.length + 1} meses registrados
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Mes Actual */}
                <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold capitalize">
                                        {currentMonthName}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Mes actual
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold">
                                    {showAmounts ? formatCurrency(currentMonthAmount) : "••••••"}
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                    <TrendingUp className="h-3 w-3" />
                                    En tiempo real
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Historial de Ingresos */}
                {isLoading ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="text-muted-foreground mt-4">Cargando historial...</p>
                        </CardContent>
                    </Card>
                ) : displayRevenues.length > 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Historial Mensual
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {displayRevenues.map((revenue) => (
                                <div
                                    key={revenue.id}
                                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-muted rounded-full">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium capitalize">
                                                {revenue.monthName} {revenue.year}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {(revenue as any).transactionCount ? `${(revenue as any).transactionCount} transacciones • ` : ''}Archivado {formatDate(revenue.archivedAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-lg">
                                            {showAmounts ? formatCurrency(revenue.totalRevenue) : "••••••"}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Mes cerrado
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-semibold text-lg mb-2">Sin historial disponible</h3>
                            <p className="text-muted-foreground">
                                No hay registros de meses anteriores archivados.
                                Los ingresos se archivarán automáticamente cada mes.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Información adicional */}
                <Card className="bg-muted/30">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <DollarSign className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-sm">
                                <p className="font-medium mb-2">Información sobre los registros</p>
                                <ul className="space-y-1 text-xs text-muted-foreground">
                                    <li>• Los ingresos del mes actual se calculan en tiempo real</li>
                                    <li>• Los registros se archivan automáticamente el primer día de cada mes</li>
                                    <li>• Las estadísticas incluyen solo pagos confirmados y procesados</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <BottomNav />
        </div>
    )
}
