"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePaymentContext } from "@/contexts/payment-provider"
import { useSettings } from "@/hooks/settings/use-settings"
import { useToast } from "@/hooks/use-toast"
import { createOptimizedPreview, formatFileSize, validatePaymentFile } from "@/lib/file-compression"
import { MethodType, PaymentStatus, UserRole } from "@/lib/types"
import { Camera, Check, DollarSign, FileImage, Loader2, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"; // <- en App Router (carpeta `app/`)
import { useEffect, useRef, useState } from "react"
import { useAuth } from "../../contexts/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Textarea } from "../ui/textarea"

interface CreatePaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreatePayment: (payment: {
        clientDni: number
        amount: number
        createdAt: string
        expiresAt: string
        method: MethodType
        file?: File
    }) => Promise<void>
}

export function CreatePaymentDialog({ open, onOpenChange, onCreatePayment }: CreatePaymentDialogProps) {
    const { user } = useAuth()
    const [isCreating, setIsCreating] = useState(false)
    const [selectedClient, setSelectedClient] = useState("")
    const today = new Date()
    const startDateStr = today.toISOString().split("T")[0]

    // Calcular fecha de vencimiento correctamente
    const calculateDueDate = (startDate: Date) => {
        const dueDate = new Date(startDate)
        
        // Sumar un mes
        dueDate.setMonth(dueDate.getMonth() + 1)
        
        // Si el día cambió (ej: 31 de enero → marzo porque febrero no tiene 31), 
        // establecer el último día del mes anterior
        if (dueDate.getDate() !== startDate.getDate()) {
            dueDate.setDate(0) // Va al último día del mes anterior
        }
        
        return dueDate
    }

    const oneMonthLater = calculateDueDate(today)
    const dueDateStr = oneMonthLater.toISOString().split("T")[0]

    const [startDate, setStartDate] = useState(startDateStr)
    const [dueDate, setDueDate] = useState(dueDateStr)

    const [amount, setAmount] = useState("")
    
    // Hook para obtener configuraciones globales (incluyendo monthly fee)
    const { monthlyFee } = useSettings()

    // Estado para método de pago
    const [paymentMethod, setPaymentMethod] = useState<MethodType>(MethodType.TRANSFER)

    // Hook para obtener pagos del cliente usando el contexto
    const { payments: clientPayments, isLoading: isLoadingPayments } = usePaymentContext()

    // Auto-populate fields when dialog opens for client role
    useEffect(() => {
        if (open && user && monthlyFee > 0) {
            setSelectedClient((user.role === UserRole.CLIENT) ? user.dni?.toString() : "")
            setAmount(monthlyFee.toString())
        }
    }, [open, user, monthlyFee])

    const [isUploading, setIsUploading] = useState(false)
    const { toast } = useToast()
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [notes, setNotes] = useState("")

    // Función para verificar si el cliente ya tiene un pago activo o pendiente
    const checkExistingPayment = (): boolean => {
        if (!clientPayments || clientPayments.length === 0) return false

        // Verificar si hay algún pago con estado "paid" o "pending"
        const hasActiveOrPendingPayment = clientPayments.some(payment =>
            payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.PENDING
        )

        return hasActiveOrPendingPayment
    }

    // Generate month options (current month and next 12 months)
    const generateMonthOptions = () => {
        const options = []
        const now = new Date()

        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
            const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
            const monthLabel = new Intl.DateTimeFormat("es-ES", {
                month: "long",
                year: "numeric",
            }).format(date)

            options.push({ value: monthStr, label: monthLabel })
        }

        return options
    }

    const monthOptions = generateMonthOptions()

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Usar nueva validación mejorada
        const validation = validatePaymentFile(file)
        if (!validation.isValid) {
            toast({
                title: "Archivo inválido",
                description: validation.error,
                variant: "destructive"
            })
            return
        }

        try {
            // Mostrar información del archivo original
            console.log(`Archivo seleccionado: ${file.name} (${formatFileSize(file.size)})`);

            setSelectedFile(file)

            // Crear preview optimizado
            const previewUrl = await createOptimizedPreview(file)
            setPreviewUrl(previewUrl)

        } catch (error) {
            console.error('Error al procesar archivo:', error)
            toast({
                title: "Error al procesar archivo",
                description: "No se pudo procesar el archivo seleccionado",
                variant: "destructive"
            })
        }
    }

    const handleCameraCapture = () => {
        if (fileInputRef.current) {
            fileInputRef.current.setAttribute("capture", "environment")
            fileInputRef.current.click()
        }
    }


    const handleRemoveFile = () => {
        setSelectedFile(null)
        setPreviewUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedClient.trim() || !startDate || !amount || !dueDate) {
            toast({
                title: "Error",
                description: "Todos los campos son requeridos",
                variant: "destructive",
            })
            return
        }

        if (user?.role === UserRole.CLIENT && !selectedFile) {
            toast({
                title: "Error",
                description: "Debes subir un comprobante para enviar el pago",
                variant: "destructive",
            })
            return
        }

        const clientIdParsed = parseInt(selectedClient, 10)
        if (
            isNaN(clientIdParsed) ||
            clientIdParsed < 0
        ) {
            toast({
                title: "Error",
                description: "El DNI debe ser un número válido y no puede ser negativo",
                variant: "destructive",
            })
            return
        }

        const amountNum = Number.parseFloat(amount)
        if (isNaN(amountNum) || amountNum <= 0) {
            toast({
                title: "Error",
                description: "El monto debe ser un número válido mayor a 0",
                variant: "destructive",
            })
            return
        }

        // Validar si el cliente ya tiene un pago activo o pendiente
        if (user?.role === UserRole.CLIENT) {
            if (isLoadingPayments) {
                toast({
                    title: "Cargando",
                    description: "Verificando pagos existentes...",
                })
                return
            }

            if (checkExistingPayment()) {
                toast({
                    title: "Error",
                    description: "Ya tienes un pago activo o pendiente. No puedes crear un nuevo pago hasta que el actual sea procesado o rechazado.",
                    variant: "destructive",
                })
                return
            }
        }

        setIsCreating(true)

        try {
            await onCreatePayment({
                clientDni: clientIdParsed,
                amount: amountNum,
                createdAt: startDate,
                expiresAt: dueDate,
                method: paymentMethod,
                file: selectedFile ?? undefined,
            })

            // Manejar el pago exitoso
            handleSuccessfulPayment()

        } catch (error: any) {
            // Manejar errores específicos del backend
            let errorMessage = "No se pudo crear el pago"

            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message
            } else if (error?.message) {
                errorMessage = error.message
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setIsCreating(false)
        }
    }

    const router = useRouter()

    const handleClose = () => {
        onOpenChange(false)
        // Redirigir según el rol del usuario
        if (user?.role === UserRole.CLIENT) {
            // router.push("/payments/method-select") DESCOMENTAR PARA DEJAR ELEGIR EL METODO DE PAGO
            router.push("/payments")
        } else {
            router.push("/payments")
        }
    }

    const handleSuccessfulPayment = () => {
        // Reset form
        setSelectedClient("")
        setStartDate("")
        setAmount("")
        setDueDate("")
        setSelectedFile(null)
        setPreviewUrl(null)
        setNotes("")
        setPaymentMethod(MethodType.TRANSFER) // Reset payment method

        // Mensaje según el rol del usuario
        const isAutomaticPayment = user?.role === UserRole.ADMIN
        const message = isAutomaticPayment
            ? "El pago se ha registrado y el cliente ha sido activado automáticamente"
            : "El pago se ha registrado correctamente"

        toast({
            title: "Pago creado",
            description: message,
        })

        // Cerrar el diálogo y redirigir a payments (ambos roles van a /payments)
        onOpenChange(false)
        router.push("/payments")
    }


    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">

                <DialogHeader>
                    <DialogTitle className="text-left flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Crear Pago Mensual
                    </DialogTitle>
                    <DialogDescription className="text-left">Asigna un pago mensual a un cliente activo</DialogDescription>
                </DialogHeader>

                <Card className="m-2">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="client">DNI del Cliente *</Label>
                        <Input
                            id="client"
                            type="number"
                            className="border border-orange-600"
                            placeholder="Ej: 30123456"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={selectedClient}
                            onChange={(e) => {
                                const value = e.target.value
                                if (/^\d*$/.test(value)) {
                                    setSelectedClient(value)
                                }
                            }}
                        />
                    </div>

                    {/* Método de Pago */}
                    <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Método de Pago *</Label>
                        {user?.role === UserRole.ADMIN ? (
                            <Select value={paymentMethod} onValueChange={(value: MethodType) => setPaymentMethod(value)}>
                                <SelectTrigger id="paymentMethod">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={MethodType.CASH}>Efectivo</SelectItem>
                                    <SelectItem value={MethodType.CARD}>Tarjeta</SelectItem>
                                    <SelectItem value={MethodType.TRANSFER}>Transferencia</SelectItem>
                                    <SelectItem value={MethodType.MERCADOPAGO}>MercadoPago</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                id="paymentMethod"
                                type="text"
                                value="Transferencia"
                                readOnly
                                className="bg-muted text-foreground cursor-not-allowed border border-gray-300"
                                onFocus={(e) => e.currentTarget.blur()}
                            />
                        )}
                    </div>

                    {/* Monto */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto ($) *</Label>
                        <Input
                            id="amount"
                            type="text"
                            value={amount}
                            readOnly
                            className="bg-muted text-foreground cursor-not-allowed border border-gray-300"
                            onFocus={(e) => e.currentTarget.blur()} // evitar edición por foco
                        />
                    </div>

                    {/* Fecha de inicio */}
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Fecha de inicio *</Label>
                        <Input
                            id="startDate"
                            type="text"
                            readOnly
                            value={new Date().toISOString().split("T")[0]}
                            placeholder="Fecha de inicio"
                            className="bg-muted text-foreground cursor-not-allowed border border-gray-300"
                        />
                    </div>

                    {/* Fecha de vencimiento */}
                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Fecha de vencimiento *</Label>
                        <Input
                            id="dueDate"
                            type="text"
                            readOnly
                            value={(() => {
                                const today = new Date()
                                const nextMonth = new Date(today)
                                
                                // Sumar un mes
                                nextMonth.setMonth(nextMonth.getMonth() + 1)
                                
                                // Si el día cambió, establecer el último día del mes anterior
                                if (nextMonth.getDate() !== today.getDate()) {
                                    nextMonth.setDate(0) // Va al último día del mes anterior
                                }

                                return nextMonth.toISOString().split("T")[0]
                            })()}
                            placeholder="Fecha de vencimiento"
                            className="bg-muted text-foreground cursor-not-allowed border border-gray-300"
                        />
                    </div>

                    {/* Subir comprobante */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <FileImage className="h-4 w-4" /> 
                                Subir Comprobante
                            </Label>
                        </div>
                        <div className="space-y-4">
                            {!selectedFile ? (
                                <div className="border-2 border-dashed p-6 text-center rounded-lg">
                                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="mb-4 text-muted-foreground">Seleccioná o tomá una foto del comprobante</p>
                                    <p className="mb-4 text-xs text-muted-foreground">Formatos soportados: JPG, PNG, WebP, PDF</p>
                                    <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileSelect} />
                                </div>
                            ) : (
                                <div>
                                    <div className="relative border rounded-lg overflow-hidden">
                                        {selectedFile.type.startsWith('image/') ? (
                                            <img src={previewUrl || ""} alt="Comprobante" className="w-full max-h-64 object-contain" />
                                        ) : (
                                            <div className="p-8 text-center">
                                                <FileImage className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                                <p className="font-medium">{selectedFile.name}</p>
                                                <p className="text-sm text-muted-foreground">Archivo PDF</p>
                                            </div>
                                        )}
                                        <Button size="sm" onClick={handleRemoveFile} className="absolute top-2 right-2" variant="destructive">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">{selectedFile.name} ({formatFileSize(selectedFile.size)})</p>
                                </div>
                            )}

                            {/* Botones de subida - aparecen siempre */}
                            <div className="flex justify-center gap-2">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isCreating}
                                >
                                    <Upload className="h-4 w-2" /> Archivo
                                </Button>
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={handleCameraCapture}
                                    disabled={isCreating}
                                >
                                    <Camera className="h-4 w-2" /> Cámara
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label>Notas (opcional)</Label>
                                <Textarea rows={3} className="border border-orange-600" value={notes} onChange={(e) => setNotes(e.target.value)} />
                            </div>
                        </div>
                    </div>
                        </form>
                    </CardContent>
                </Card>

                <DialogFooter className="flex gap-3">
                    <div className="flex gap-2 justify-end mt-2 w-full">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={handleClose}
                            disabled={isCreating}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            disabled={isCreating}
                            className="flex-1"
                            onClick={handleSubmit}
                        >
                            {isCreating ? (
                                <Loader2 className="animate-spin mr-1 h-4 w-4" />
                            ) : (
                                <Check className="mr-1 h-4 w-4" />
                            )}
                            {isCreating ? "Creando..." : "Aceptar"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    )
}

