"use client"

import { esMonthFormatter, esMonthYearFormatter } from "@/lib/formatters"
import { PaymentDetailsDialog } from "@/components/payments/payment-details-dialog"
import { PaymentVerificationDialog } from "@/components/payments/payment-verification-dialog"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePaymentsPage } from "@/hooks/payments/use-payments-page"
import { PaymentType } from "@/lib/types"
import { UserRole } from "@/types"

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

interface PaymentListProps {
    payments: PaymentType[]
    forcePendingBadge?: boolean
    canVerify?: boolean
    onDetails: (_paymentId: number) => void
    onVerify: (_paymentId: number) => void
    formatDate: (_date: Date | string | null) => string
    getMethodText: (_method: PaymentType["method"]) => string
    getStatusColor: (_status: string) => "success" | "warning" | "destructive" | "secondary"
    getStatusText: (_status: string) => string
}

function PaymentList({
    payments,
    forcePendingBadge,
    canVerify,
    onDetails,
    onVerify,
    formatDate,
    getMethodText,
    getStatusColor,
    getStatusText,
}: PaymentListProps) {
    if (payments.length === 0) {
        return (
            <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                No hay pagos para mostrar
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {payments.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-xl border transition-colors hover:bg-muted/40">
                    <button
                        type="button"
                        className="w-full px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Ver detalles del pago de ${p.clientName}`}
                        onClick={() => onDetails(p.id)}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <User className="size-4 shrink-0 text-primary/70" />
                                    <h3 className="truncate font-medium">{p.clientName}</h3>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="size-3 shrink-0" />
                                    <span>{formatDate(p.createdAt)}</span>
                                    <span>•</span>
                                    <span>Vence: {formatDate(p.expiresAt)}</span>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Método: {getMethodText(p.method)}
                                </p>
                            </div>
                            <div className="shrink-0 text-right">
                                <div className="text-lg font-bold">${p.amount}</div>
                                {forcePendingBadge ? (
                                    <Badge variant="warning" className="text-xs">
                                        Pendiente
                                    </Badge>
                                ) : (
                                    <Badge variant={getStatusColor(p.status)} className="text-xs">
                                        {getStatusText(p.status)}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {p.rejectionReason && (
                            <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-2 text-sm text-destructive">
                                <strong>Razón:</strong> {p.rejectionReason}
                            </div>
                        )}
                    </button>

                    {forcePendingBadge && canVerify && (
                        <div className="px-4 pb-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full bg-transparent"
                                onClick={() => onVerify(p.id)}
                            >
                                <Eye className="size-4 mr-2" />
                                Verificar Pago
                            </Button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default function PaymentsPage() {
    const {
        user,
        router,
        searchTerm,
        setSearchTerm,
        showRevenue,
        setShowRevenue,
        selectedYear,
        selectedMonth,
        isLoadingAdminPayments,
        verificationDialog,
        setVerificationDialog,
        detailsDialog,
        setDetailsDialog,
        sortedAllPayments,
        pendingPayments,
        totalRevenue,
        activePayment,
        pendingPayment,
        canCreateNewPayment,
        formatDate,
        getStatusColor,
        getStatusText,
        formatCurrency,
        getMethodText,
        handleVerificationClick,
        handleDetailsClick,
        handleMonthChange,
        handleYearChange,
        getCurrentDateInfo,
    } = usePaymentsPage()

    if (user?.role === UserRole.TRAINER) {
        return <div>No tienes permisos para ver esta página</div>
    }

    return (
        <div className="min-h-screen bg-background pb-safe-bottom">
            <MobileHeader
                title="Pagos"
                actions={
                    <div className="flex gap-x-2">
                        {(user?.role === UserRole.ADMIN || user?.role === UserRole.CLIENT) && (
                            <Button
                                size="sm"
                                onClick={() => router.push("/payments/new")}
                                disabled={!canCreateNewPayment}
                                className={!canCreateNewPayment ? "opacity-50 cursor-not-allowed" : undefined}
                            >
                                <Plus className="size-4 mr-1" />
                                Nuevo
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="container-centered py-6 space-y-6">
                {/* Search y filtros */}
                {user?.role === UserRole.ADMIN && (
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
                                        {esMonthFormatter.format(new Date(2024, selectedMonth - 1))}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {(() => {
                                        const { currentYear, currentMonth } = getCurrentDateInfo()
                                        const maxMonth = selectedYear === currentYear ? currentMonth : 12

                                        return Array.from({ length: maxMonth }, (_, i) => (
                                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                {esMonthFormatter.format(new Date(2024, i))}
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

                {/* Estado de membresía del cliente — banner plano */}
                {user?.role === UserRole.CLIENT && (
                    <div
                        className={`flex items-center gap-3 rounded-xl border p-4 ${
                            activePayment
                                ? "border-green-500/30 bg-green-500/5"
                                : pendingPayment
                                    ? "border-yellow-500/30 bg-yellow-500/5"
                                    : "border-destructive/30 bg-destructive/5"
                        }`}
                    >
                        {activePayment ? (
                            <>
                                <CheckCircle className="size-5 shrink-0 text-green-600" />
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-green-700 dark:text-green-400">Plan Vigente</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Tu plan está activo hasta {formatDate(activePayment.expiresAt)}
                                    </p>
                                </div>
                            </>
                        ) : pendingPayment ? (
                            <>
                                <Clock className="size-5 shrink-0 text-yellow-600" />
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-yellow-700 dark:text-yellow-400">Pago Pendiente</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Tu pago está pendiente de verificación
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="size-5 shrink-0 text-destructive" />
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-destructive">Membresía Vencida</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Tu membresía ha expirado. Presioná en{" "}
                                        <span className="font-semibold text-destructive">&apos;Nuevo&apos;</span> para
                                        registrar tu pago.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Ingresos del mes — solo admin */}
                {user?.role === UserRole.ADMIN && (
                    <div className="rounded-2xl border p-4">
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Ingresos de {esMonthYearFormatter.format(new Date(selectedYear, selectedMonth - 1))}
                            </p>
                            <div className="flex shrink-0 items-center gap-1.5">
                                <DollarSign className="size-4 text-primary/70" />
                                <button
                                    type="button"
                                    onClick={() => setShowRevenue(!showRevenue)}
                                    className="rounded-full p-0.5 transition-colors hover:bg-muted"
                                    aria-label={showRevenue ? "Ocultar ingresos" : "Mostrar ingresos"}
                                >
                                    {showRevenue ? (
                                        <Eye className="size-4 text-muted-foreground" />
                                    ) : (
                                        <EyeOff className="size-4 text-muted-foreground" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-semibold tracking-tight">
                            {isLoadingAdminPayments ? "..." : (showRevenue ? formatCurrency(totalRevenue) : "••••••")}
                        </p>
                    </div>
                )}

                {/* Listado de pagos */}
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pending">{pendingPayments.length} Pendientes </TabsTrigger>
                        <TabsTrigger value="all">Todos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-4">
                        <PaymentList
                            payments={sortedAllPayments}
                            onDetails={handleDetailsClick}
                            onVerify={handleVerificationClick}
                            formatDate={formatDate}
                            getMethodText={getMethodText}
                            getStatusColor={getStatusColor}
                            getStatusText={getStatusText}
                        />
                    </TabsContent>

                    <TabsContent value="pending" className="mt-4">
                        <PaymentList
                            payments={pendingPayments}
                            forcePendingBadge
                            canVerify={user?.role === UserRole.ADMIN}
                            onDetails={handleDetailsClick}
                            onVerify={handleVerificationClick}
                            formatDate={formatDate}
                            getMethodText={getMethodText}
                            getStatusColor={getStatusColor}
                            getStatusText={getStatusText}
                        />
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
                    className="fixed bottom-28 left-1/2 -translate-x-1/2 lg:bottom-8 z-50 shadow-lg transition-shadow bg-secondary rounded-full p-3"
                    size="default"
                    onClick={() => router.push("/payments/verify")}
                >
                    <FileCheck className="size-5" />
                    Verificar ({pendingPayments.length})
                </Button>
            )}
        </div>
    )
}
