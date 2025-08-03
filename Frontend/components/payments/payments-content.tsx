"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/providers/auth-provider"
import { usePayment } from "@/hooks/use-payment"

import { PaymentVerificationDialog } from "@/components/payments/payment-verification-dialog"
import { BottomNav } from "@/components/ui/bottom-nav"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import {
    Calendar,
    DollarSign,
    Eye,
    FileCheck,
    Loader2,
    Plus,
    Search,
    User,
} from "lucide-react"

export default function PaymentsContent() {
    const { user } = useAuth()
    const [searchTerm, setSearchTerm] = useState("")

    const {
        payments,
        isLoading,
        error,
        updatePaymentStatus,
        createNewPayment,
    } = usePayment(user?.id, user?.role === "admin")

    const [verificationDialog, setVerificationDialog] = useState({
        open: false,
        paymentId: null as number | null,
    })

    if (!user) return null

    // if (loading) {
    //     return (
    //       <div className="min-h-screen flex items-center justify-center">
    //         <Loader2 className="h-8 w-8 animate-spin" />
    //       </div>
    //     )
    //   }

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

    const handleVerificationClick = (id: number) => {
        setVerificationDialog({ open: true, paymentId: id })
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <MobileHeader
                title="Pagos"
                actions={
                    <div className="flex gap-x-2">
                        {user.role === "admin" ? (
                            <>
                                <Link href={pendingPayments.length <= 0 ? '#' : '/payments/verify'}
                                    className={pendingPayments.length <= 0 ? 'disabled-link' : ''}
                                    aria-disabled={pendingPayments.length <= 0}>
                                    <Button size="sm" variant="outline" className="bg-transparent">
                                        <FileCheck className="h-4 w-4" />
                                        Verificar ({pendingPayments.length})
                                    </Button>
                                </Link>
                                <Link href="/payments/new">
                                    <Button size="sm">
                                        <Plus className="h-4 w-4" />
                                        Nuevo
                                    </Button>
                                </Link>
                            </>
                        ) : user.role === "client" ? (
                            <Link href="/payments/new">
                                <Button size="sm">
                                    <Plus className="h-4 w-4" />
                                    Nuevo
                                </Button>
                            </Link>
                        ) : null}
                    </div>
                }
            />

            <div className="container py-6 space-y-6">
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

                {/* Stats */}
                {user.role === "admin" && (
                    <div className="grid grid-rows-1 gap-4">
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
                        {/* Esta card para mi es innecesaria, ya que contamos con los pendientes en la tab de pendientes y además el botón de verificr tambén lo especifica */}
                        {/* <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Por Verificar</p>
                                        <p className="text-2xl font-bold text-warning">{pendingPayments.length}</p>
                                    </div>
                                    <FileCheck className="h-8 w-8 text-warning" />
                                </div>
                            </CardContent>
                        </Card> */}
                    </div>
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
