"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { usePayment } from "@/hooks/use-payment"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useEffect, useState } from "react"

import { PaymentVerificationDialog } from "@/components/payments/payment-verification-dialog"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
    Calendar,
    DollarSign,
    Eye,
    FileCheck,
    Plus,
    Search,
    User,
} from "lucide-react"

export default function PaymentsPage() {
    const { user } = useAuth()
    const [searchTerm, setSearchTerm] = useState("")
    const queryClient = useQueryClient()

    const {
        payments,
        updatePaymentStatus,
        isLoading,
    } = usePayment(user?.id, user?.role === "admin")

    // Forzar actualización de datos cuando se monta el componente
    useEffect(() => {
        if (user?.id) {
            queryClient.invalidateQueries({ queryKey: ["payments", user.id] })
        }
    }, [user?.id, queryClient])

    // Forzar actualización adicional cuando se detecta que viene de una página de resultado
    useEffect(() => {
        const checkIfFromPaymentResult = () => {
            // Verificar si viene de una página de resultado de MercadoPago
            const referrer = document.referrer;
            if (referrer && (
                referrer.includes('/payments/result/success') ||
                referrer.includes('/payments/result/pending') ||
                referrer.includes('/payments/result/failure')
            )) {
                if (user?.id) {
                    console.log('🔄 Forzando actualización desde resultado de pago...');
                    queryClient.invalidateQueries({ queryKey: ["payments", user.id] });
                }
            }
        };

        // Ejecutar después de un pequeño delay para asegurar que el componente esté montado
        const timer = setTimeout(checkIfFromPaymentResult, 100);
        return () => clearTimeout(timer);
    }, [user?.id, queryClient]);

    const [verificationDialog, setVerificationDialog] = useState({
        open: false,
        paymentId: null as number | null,
    })

    if (!user) return null

    const formatMonth = (date: Date) => {
        return new Intl.DateTimeFormat("es-ES", {
            month: "long",
            year: "numeric",
        }).format(new Date(date))
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(new Date(date))
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "paid":
                return "success"
            case "pending":
                return "warning"
            case "rejected":
            case "debtor":
                return "destructive"
            default:
                return "secondary"
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case "paid":
                return "Pagado"
            case "pending":
                return "Pendiente"
            case "rejected":
                return "Rechazado"
            case "debtor":
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

    const filteredPayments = payments.filter(
        (p) =>
            p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            formatDate(p.createdAt).toLowerCase().includes(searchTerm.toLowerCase()),
    )
    const paidPayments = filteredPayments.filter((p) => p.status === "paid")
    const pendingPayments = filteredPayments.filter((p) => p.status === "pending")
    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0)

    // Lógica para determinar si el cliente puede crear un nuevo pago
    const canCreateNewPayment = user.role === "client" &&
        user.status !== "active" &&
        pendingPayments.length === 0

    // Obtener información del plan activo si existe
    const activePayment = paidPayments.find(p => p.status === "paid")
    const pendingPayment = pendingPayments.find(p => p.status === "pending")

    const handleVerificationClick = (id: number) => {
        setVerificationDialog({ open: true, paymentId: id })
    }

    return (
        <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
            <MobileHeader
                title="Pagos"
                actions={
                    <div className="flex gap-x-2">
                        {user.role === "admin" ? (
                            <>
                                <Link href={pendingPayments.length <= 0 ? '#' : '/payments/verify'}
                                    className={pendingPayments.length <= 0 ? 'pointer-events-none' : ''}
                                    aria-disabled={pendingPayments.length <= 0}>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className={`bg-transparent ${pendingPayments.length <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={pendingPayments.length <= 0}
                                    >
                                        <FileCheck className="h-4 w-4" />
                                        Verificar ({pendingPayments.length})
                                    </Button>
                                </Link>
                                <Link href="/payments/method-select">
                                    <Button size="sm">
                                        <Plus className="h-4 w-4" />
                                        Nuevo
                                    </Button>
                                </Link>
                            </>
                        ) : user.role === "client" ? (
                            <div className="relative">
                                {isLoading ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="btn-disabled"
                                        disabled
                                    >
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                                        Cargando...
                                    </Button>
                                ) : canCreateNewPayment ? (
                                    <Link href="/payments/method-select">
                                        <Button size="sm">
                                            <Plus className="h-4 w-4" />
                                            Nuevo
                                        </Button>
                                    </Link>
                                                                 ) : (
                                     <Button 
                                         size="sm" 
                                         variant="outline" 
                                         className={`${
                                             activePayment 
                                                 ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200 font-medium' 
                                                 : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                                         } cursor-not-allowed`}
                                         disabled
                                     >
                                         {activePayment 
                                             ? `Plan vigente hasta: ${formatDate(activePayment.expiresAt)}`
                                             : pendingPayment 
                                                 ? "Pago pendiente de revisión"
                                                 : "Nuevo"
                                         }
                                     </Button>
                                 )}
                            </div>
                        ) : null}
                    </div>
                }
            />

            <div className="container-centered py-6 space-y-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por cliente o mes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Stats - Solo para admin */}
                {user.role === "admin" && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-bold">Ingresos del Mes</p>
                                    <p className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
                                </div>
                                <DollarSign className="h-8 w-8 text-success" />
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
                        {filteredPayments.map((p) => (
                            <Card key={p.id}>
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
                            <Card key={p.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <h3 className="font-medium">{p.clientName}</h3>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatMonth(p.createdAt)}</span>
                                                <span>•</span>
                                                <span>Vence: {formatDate(p.expiresAt)}</span>
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
                                        {user?.role === "admin" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 bg-transparent"
                                                onClick={() => handleVerificationClick(p.id)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Verificar Comprobante
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>
                </Tabs>
            </div>

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
        </div>
    )
}