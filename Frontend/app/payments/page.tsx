"use client"

import { fetchPaymentsByMonthAndYear } from "@/api/payments/paymentsApi"
import { usePaymentContext } from "@/contexts/payment-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { MethodType, PaymentStatus, UserRole } from "@/lib/types"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { PaymentDetailsDialog } from "@/components/payments/payment-details-dialog"
import { PaymentVerificationDialog } from "@/components/payments/payment-verification-dialog"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Eye,
    EyeOff,
    FileCheck,
    Plus,
    Search,
    User,
} from "lucide-react"

export default function PaymentsPage() {
    const { user } = useRequireAuth()
    const router = useRouter()
    const queryClient = useQueryClient()

    // Estados básicos
    const [searchTerm, setSearchTerm] = useState("")
    const [showRevenue, setShowRevenue] = useState(true)

    // Estados para admin
    const currentDate = new Date()
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
    const [adminPayments, setAdminPayments] = useState<any[]>([])
    const [isLoadingAdminPayments, setIsLoadingAdminPayments] = useState(false)

    const {
        payments,
        updatePaymentStatus,
        isLoading,
    } = usePaymentContext()


    // useEffect 1: Refrescar datos al montar y detectar cambios de usuario
    useEffect(() => {
        if (!user?.id && user?.role !== UserRole.ADMIN) return

        const queryKey = user?.role === UserRole.ADMIN ? ["payments", "admin"] : ["payments", user.id]

        const refreshData = () => {
            queryClient.invalidateQueries({ queryKey })
            if (user?.role === UserRole.ADMIN) {
                queryClient.invalidateQueries({ queryKey: ["monthlyRevenue"] })
            }
        }

        // Actualización inicial
        refreshData()


    }, [user?.id, user?.role, queryClient])

    // useEffect 2: Cargar pagos por mes/año para admin
    useEffect(() => {
        if (user?.role !== UserRole.ADMIN) return

        setIsLoadingAdminPayments(true)
        fetchPaymentsByMonthAndYear(selectedYear, selectedMonth)
            .then(paymentsData => setAdminPayments(paymentsData))
            .catch(error => {
                console.error('Error cargando pagos por mes:', error)
                setAdminPayments([])
            })
            .finally(() => setIsLoadingAdminPayments(false))
    }, [user?.role, selectedYear, selectedMonth])

    // useEffect 3: Validar fechas para evitar fechas futuras
    useEffect(() => {
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth() + 1

        if (selectedYear > currentYear) {
            setSelectedYear(currentYear)
            setSelectedMonth(currentMonth)
            return
        }

        if (selectedYear === currentYear && selectedMonth > currentMonth) {
            setSelectedMonth(currentMonth)
        }
    }, [selectedYear, selectedMonth])

    const [verificationDialog, setVerificationDialog] = useState({
        open: false,
        paymentId: null as number | null,
    })

    const [detailsDialog, setDetailsDialog] = useState({
        open: false,
        paymentId: null as number | null,
    })

    if (user?.role === UserRole.TRAINER) {
        return <div>No tienes permisos para ver esta página</div>
    }

    const formatDate = (date: Date | string | null) => {
        if (!date) return ""
        return new Intl.DateTimeFormat("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(new Date(date))
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case PaymentStatus.PAID:
                return "success"
            case PaymentStatus.PENDING:
                return "warning"
            case PaymentStatus.REJECTED:
            case PaymentStatus.EXPIRED:
                return "destructive"
            default:
                return "secondary"
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case PaymentStatus.PAID:
                return "Pagado"
            case PaymentStatus.PENDING:
                return "Pendiente"
            case PaymentStatus.REJECTED:
                return "Rechazado"
            case PaymentStatus.EXPIRED:
                return "Vencido"
            default:
                return status
        }
    }

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat("es-AR", {
            style: "decimal",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)
    }

    const getMethodText = (method: MethodType) => {
        switch (method) {
            case MethodType.CASH:
                return "Efectivo"
            case MethodType.CARD:
                return "Tarjeta"
            case MethodType.TRANSFER:
                return "Transferencia"
            default:
                return method
        }
    }

    // Cálculos simples y directos (sin useMemo innecesario)
    const sourcePayments = user?.role === UserRole.ADMIN ? adminPayments : payments

    const filteredPayments = sourcePayments.filter((p: any) => {
        if (user?.role !== UserRole.ADMIN) {
            return true
        }

        return p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            formatDate(p.createdAt).toLowerCase().includes(searchTerm.toLowerCase())
    })

    const sortedAllPayments = [...filteredPayments].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA // Descendente: más nuevos primero
    })

    const paidPayments = filteredPayments.filter((p: any) => p.status === PaymentStatus.PAID)

    const pendingPayments = filteredPayments
        .filter((p: any) => p.status === PaymentStatus.PENDING)
        .sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || 0).getTime()
            const dateB = new Date(b.createdAt || 0).getTime()
            if (user?.role === UserRole.CLIENT) {
                return dateB - dateA // Descendente: mas nuevos primero
            }
            return dateA - dateB // Ascendente: mas viejos primero para verificacion admin
        })

    const totalRevenue = user?.role === UserRole.ADMIN
        ? adminPayments
            .filter((p: any) => p.status === PaymentStatus.EXPIRED || p.status === PaymentStatus.PAID)
            .reduce((sum: number, p: any) => sum + p.amount, 0)
        : paidPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

    const activePayment = paidPayments.find((p: any) => {
        const now = new Date()
        const expiresAt = p.expiresAt ? new Date(p.expiresAt) : null
        return p.status === PaymentStatus.PAID && expiresAt && expiresAt > now
    })

    const pendingPayment = pendingPayments.find((p: any) => p.status === PaymentStatus.PENDING)

    // Lógica para determinar si el cliente puede crear un nuevo pago
    const canCreateNewPayment = user?.role === UserRole.ADMIN || (
        user?.role === UserRole.CLIENT && !activePayment && !pendingPayment
    )

    // Handlers simples para diálogos
    const handleVerificationClick = (id: number) => {
        setVerificationDialog({ open: true, paymentId: id })
    }

    const handleDetailsClick = (id: number) => {
        setDetailsDialog({ open: true, paymentId: id })
    }

    // Handlers simples para selectores
    const handleMonthChange = (value: string) => {
        setSelectedMonth(parseInt(value))
    }

    const handleYearChange = (value: string) => {
        const newYear = parseInt(value)
        setSelectedYear(newYear)

        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth() + 1

        if (newYear === currentYear && selectedMonth > currentMonth) {
            setSelectedMonth(currentMonth)
        }
    }

    // Datos simples para selectores (calculados en línea)
    const getCurrentDateInfo = () => {
        const currentDate = new Date()
        return {
            currentYear: currentDate.getFullYear(),
            currentMonth: currentDate.getMonth() + 1
        }
    }

    return (
        <div className="min-h-screen bg-background pb-32">
            <MobileHeader
                title="Pagos"
                actions={
                    <div className="flex gap-x-2">
                        {user?.role === UserRole.ADMIN ? (
                            <Button
                                size="sm"
                                onClick={() => router.push("/payments/new")}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Nuevo
                            </Button>
                        ) : user?.role === UserRole.CLIENT ? (
                            canCreateNewPayment ? (
                                <Button
                                    size="sm"
                                    onClick={() => router.push("/payments/new")}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Nuevo
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    disabled={true}
                                    className="opacity-50 cursor-not-allowed"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nuevo
                                </Button>
                            )
                        ) : null}
                    </div>
                }
            />

            <div className="container-centered py-6 space-y-6">
                {/* Search y filtros */}
                {user?.role === UserRole.ADMIN && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Filtro por mes y año */}
                        <div className="grid grid-cols-2 gap-3">
                            <Select
                                value={selectedMonth.toString()}
                                onValueChange={handleMonthChange}
                            >
                                <SelectTrigger>
                                    <SelectValue>
                                        {new Intl.DateTimeFormat("es-ES", { month: "long" }).format(new Date(2024, selectedMonth - 1))}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {(() => {
                                        const { currentYear, currentMonth } = getCurrentDateInfo()
                                        const maxMonth = selectedYear === currentYear ? currentMonth : 12

                                        return Array.from({ length: maxMonth }, (_, i) => (
                                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                {new Intl.DateTimeFormat("es-ES", { month: "long" }).format(new Date(2024, i))}
                                            </SelectItem>
                                        ))
                                    })()}
                                </SelectContent>
                            </Select>

                            <Select
                                value={selectedYear.toString()}
                                onValueChange={handleYearChange}
                            >
                                <SelectTrigger>
                                    <SelectValue>{selectedYear}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {(() => {
                                        const { currentYear } = getCurrentDateInfo()
                                        const years = []

                                        for (let year = currentYear - 3; year <= currentYear; year++) {
                                            years.push(year)
                                        }

                                        return years.map(year => (
                                            <SelectItem key={year} value={year.toString()}>
                                                {year}
                                            </SelectItem>
                                        ))
                                    })()}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {/* Card informativa para clientes */}
                {user?.role === UserRole.CLIENT && (
                    <Card className={`${activePayment ? 'bg-green-50 border-green-200' : pendingPayment ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                {activePayment ? (
                                    <>
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-green-800">Plan Vigente</h3>
                                            <p className="text-sm text-green-700">
                                                Tu plan está activo hasta {formatDate(activePayment.expiresAt)}
                                            </p>
                                        </div>
                                    </>
                                ) : pendingPayment ? (
                                    <>
                                        <Clock className="h-5 w-5 text-yellow-600" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-yellow-800">Pago Pendiente</h3>
                                            <p className="text-sm text-yellow-700">
                                                Tu pago está pendiente de verificación
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-red-800">Membresía Vencida</h3>
                                            <p className="text-sm text-yellow-700">
                                                Tu membresía ha expirado.<br />
                                                Presiona en <span className="font-semibold text-red-800">&apos;Nuevo&apos;</span> para registrar tu pago.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stats - Solo para admin */}
                {user?.role === UserRole.ADMIN && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-bold">
                                        Ingresos de {new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date(selectedYear, selectedMonth - 1))}
                                    </p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {isLoadingAdminPayments ? "..." : (showRevenue ? formatCurrency(totalRevenue) : "••••••")}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowRevenue(!showRevenue)}
                                        className="p-1 hover:bg-muted rounded-full transition-colors"
                                        aria-label={showRevenue ? "Ocultar ingresos" : "Mostrar ingresos"}
                                    >
                                        {showRevenue ? (
                                            <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                        ) : (
                                            <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                        )}
                                    </button>
                                    <DollarSign className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Payments Tabs */}
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pending">{pendingPayments.length} Pendientes </TabsTrigger>
                        <TabsTrigger value="all">Todos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-3 mt-4">
                        {sortedAllPayments.map((p) => (
                            <Card key={p.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleDetailsClick(p.id)}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <h3 className="font-medium">{p.clientName}</h3>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDate(p.createdAt)}</span>
                                                <span>•</span>
                                                <span>Vence: {formatDate(p.expiresAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                <span>Método: {getMethodText(p.method)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-lg">${p.amount}</div>
                                            <Badge variant={getStatusColor(p.status)} className="text-xs">
                                                {getStatusText(p.status)}
                                            </Badge>
                                        </div>
                                    </div>

                                    {p.rejectionReason && (
                                        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                                            <strong>Razón:</strong> {p.rejectionReason}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    <TabsContent value="pending" className="space-y-3 mt-4">
                        {pendingPayments.map((p) => (
                            <Card key={p.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleDetailsClick(p.id)}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <h3 className="font-medium">{p.clientName}</h3>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDate(p.createdAt)}</span>
                                                <span>•</span>
                                                <span>Vence: {formatDate(p.expiresAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                <span>Método: {getMethodText(p.method)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-lg">${p.amount}</div>
                                            <Badge variant="warning" className="text-xs">
                                                Pendiente
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {user?.role === UserRole.ADMIN && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 bg-transparent"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleVerificationClick(p.id)
                                                }}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Verificar Pago
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>
                </Tabs>

            </div>

            {detailsDialog.paymentId !== null && (
                <PaymentDetailsDialog
                    open={detailsDialog.open}
                    onOpenChange={(open) =>
                        setDetailsDialog({ open, paymentId: null })
                    }
                    paymentId={detailsDialog.paymentId}
                />
            )}

            {verificationDialog.paymentId !== null && (
                <PaymentVerificationDialog
                    open={verificationDialog.open}
                    onOpenChange={(open) =>
                        setVerificationDialog({ open, paymentId: null })
                    }
                    paymentId={verificationDialog.paymentId}
                />
            )}

            <BottomNav />

            {/* Botón flotante de verificación - Solo visible para admins con pagos pendientes */}
            {user?.role === UserRole.ADMIN && pendingPayments.length > 0 && (
                <Button
                    className="fixed bottom-28 left-1/2 transform -translate-x-1/2 z-50 shadow-lg transition-shadow bg-secondary rounded-full px-3 py-3"
                    size="default"
                    onClick={() => router.push("/payments/verify")}
                >
                    <FileCheck className="h-5 w-5" />
                    Verificar ({pendingPayments.length})
                </Button>
            )}
        </div>
    )
}
