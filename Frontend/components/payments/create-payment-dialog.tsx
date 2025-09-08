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
import { AlertCircle, Camera, Check, DollarSign, FileImage, Loader2, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"; // <- en App Router (carpeta `app/`)
import { useEffect, useRef, useState } from "react"
import { useAuth } from "../../contexts/auth-provider"
import { Card, CardContent } from "../ui/card"
import { Textarea } from "../ui/textarea"

interface CreatePaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreatePayment: (payment: {
        clientDnis: number[]  // Cambiado de clientDni a clientDnis (array)
        createdByDni: number  // DNI del usuario que crea el pago
        amount: number
        createdAt: string
        expiresAt: string
        method: MethodType
        notes?: string // Notas adicionales del pago
        file?: File
    }) => Promise<void>
}

export function CreatePaymentDialog({ open, onOpenChange, onCreatePayment }: CreatePaymentDialogProps) {
    const { user } = useAuth()
    const [isCreating, setIsCreating] = useState(false)
    
    // Estados para manejar múltiples DNIs
    const [clientDnis, setClientDnis] = useState<string[]>([""]) // Array de DNIs como strings
    const [validatedUsers, setValidatedUsers] = useState<Array<{ 
        dni: number; 
        name: string; 
        isValid: boolean; 
        isValidating: boolean; 
        errorMessage?: string;
        hasActivePlan?: boolean;
    }>>([])
    const [debounceTimers, setDebounceTimers] = useState<Array<NodeJS.Timeout | null>>([])
    const [baseAmount, setBaseAmount] = useState("") // Monto base individual
    
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

    // Estado para método de pago - inicializar vacío para que el usuario deba elegir
    const [paymentMethod, setPaymentMethod] = useState<MethodType | "">("") 

    // Hook para obtener pagos del cliente usando el contexto
    const { payments: clientPayments, isLoading: isLoadingPayments } = usePaymentContext()

    // Función para resetear todos los estados
    const resetFormState = () => {
        setClientDnis([""])
        setValidatedUsers([{ 
            dni: 0, 
            name: "", 
            isValid: false, 
            isValidating: false,
            hasActivePlan: false
        }])
        
        // Limpiar todos los timers
        debounceTimers.forEach(timer => {
            if (timer) clearTimeout(timer)
        })
        setDebounceTimers([null])
        
        setBaseAmount("")
        setAmount("")
        setPaymentMethod("")
        setNotes("")
        setSelectedFile(null)
        setPreviewUrl(null)
        setIsCreating(false)
        setIsUploading(false)
        
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    // Auto-populate fields when dialog opens for client role
    useEffect(() => {
        if (open && user && monthlyFee > 0) {
            // Si es cliente, pre-llenar con su DNI
            if (user.role === UserRole.CLIENT && user.dni) {
                setClientDnis([user.dni.toString()])
                // Validar automáticamente el DNI del cliente
                setTimeout(() => {
                    validateDni(0, user.dni.toString())
                }, 100)
            } else {
                setClientDnis([""])
            }
            setBaseAmount(monthlyFee.toString())
        }
    }, [open, user, monthlyFee])

    // Actualizar amount cuando cambie baseAmount o validatedUsers
    useEffect(() => {
        const validUsersCount = validatedUsers.filter(user => user.isValid).length
        if (validUsersCount > 0 && baseAmount) {
            const base = parseFloat(baseAmount) || 0
            const total = base * validUsersCount
            setAmount(total.toString())
        } else if (baseAmount) {
            setAmount(baseAmount)
        }
    }, [baseAmount, validatedUsers])

    // Cleanup timers on unmount y cuando cambie el estado del diálogo
    useEffect(() => {
        return () => {
            resetFormState()
        }
    }, [])

    // Limpiar timers cuando se cierre el diálogo
    useEffect(() => {
        if (!open) {
            resetFormState()
        }
    }, [open])

    // Funciones para manejar múltiples DNIs
    const addDniField = () => {
        setClientDnis(prev => [...prev, ""])
        setValidatedUsers(prev => [...prev, { 
            dni: 0, 
            name: "", 
            isValid: false, 
            isValidating: false,
            hasActivePlan: false
        }])
        setDebounceTimers(prev => [...prev, null])
    }

    const removeDniField = (index: number) => {
        if (clientDnis.length > 1) {
            // Limpiar el timer del índice a eliminar
            if (debounceTimers[index]) {
                clearTimeout(debounceTimers[index]!)
            }
            
            // Actualizar todos los estados removiendo el índice correspondiente
            setClientDnis(prev => prev.filter((_, i) => i !== index))
            setValidatedUsers(prev => prev.filter((_, i) => i !== index))
            setDebounceTimers(prev => prev.filter((_, i) => i !== index))
        }
    }

    const updateDni = (index: number, value: string) => {
        const newDnis = [...clientDnis]
        newDnis[index] = value
        setClientDnis(newDnis)
        
        // Limpiar el timer anterior para este índice
        if (debounceTimers[index]) {
            clearTimeout(debounceTimers[index]!)
        }
        
        // Si el campo está vacío, limpiar la validación inmediatamente
        if (!value.trim()) {
            const newValidatedUsers = [...validatedUsers]
            newValidatedUsers[index] = { 
                dni: 0, 
                name: "", 
                isValid: false, 
                isValidating: false,
                hasActivePlan: false
            }
            setValidatedUsers(newValidatedUsers)
            return
        }

        // Establecer estado de validación en progreso
        const newValidatedUsers = [...validatedUsers]
        newValidatedUsers[index] = { 
            dni: 0, 
            name: "", 
            isValid: false, 
            isValidating: true,
            hasActivePlan: false
        }
        setValidatedUsers(newValidatedUsers)
        
        // Configurar nuevo timer con debounce de 1000ms (1 segundo)
        const newTimer = setTimeout(() => {
            validateDni(index, value.trim())
        }, 1000)
        
        const newTimers = [...debounceTimers]
        newTimers[index] = newTimer
        setDebounceTimers(newTimers)
    }

    const validateDni = async (index: number, dniString: string) => {
        try {
            // Validar que sea un número válido
            const dni = parseInt(dniString, 10)
            if (isNaN(dni)) {
                throw new Error("El DNI debe ser un número válido")
            }

            // Buscar usuario por DNI
            const { fetchUserByDni } = await import('@/api/clients/usersApi')
            const user = await fetchUserByDni(dni)
            
            // Verificar si el usuario tiene un plan activo
            const hasActivePlan = user.status === 'ACTIVE'
            
            const newValidatedUsers = [...validatedUsers]
            
            if (hasActivePlan) {
                // Usuario válido pero con plan activo
                newValidatedUsers[index] = { 
                    dni, 
                    name: user.name,
                    isValid: false, // No es válido para crear pago
                    isValidating: false,
                    hasActivePlan: true,
                    errorMessage: `${user.name} ya tiene un plan activo`
                }
            } else {
                // Usuario válido y sin plan activo
                newValidatedUsers[index] = { 
                    dni, 
                    name: user.name,
                    isValid: true,
                    isValidating: false,
                    hasActivePlan: false
                }
            }
            
            setValidatedUsers(newValidatedUsers)
            
        } catch (error: any) {
            console.error('Error validando DNI:', error)
            const newValidatedUsers = [...validatedUsers]
            let errorMessage = "Error inesperado"
            
            // Verificar diferentes tipos de error 404
            if (error?.response?.status === 404 || 
                error?.status === 404 || 
                error?.code === 404 ||
                (error?.message && error.message.includes('404'))) {
                errorMessage = "DNI no encontrado"
            } else if (error?.message?.includes("Network Error") || 
                       error?.message?.includes("ERR_NETWORK") ||
                       error?.code === 'NETWORK_ERROR') {
                errorMessage = "Error de conexión"
            } else if (error?.message === "El DNI debe ser un número válido") {
                errorMessage = error.message
            } else if (error?.message) {
                // Si el mensaje contiene información útil, usarlo
                if (error.message.includes("DNI") || error.message.includes("usuario")) {
                    errorMessage = error.message
                } else {
                    errorMessage = "DNI no encontrado" // Asumir 404 por defecto
                }
            }
            
            newValidatedUsers[index] = { 
                dni: 0, 
                name: "", 
                isValid: false, 
                isValidating: false,
                hasActivePlan: false,
                errorMessage
            }
            setValidatedUsers(newValidatedUsers)
        }
    }

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

        // Validar que todos los DNIs estén completos y validados
        if (clientDnis.some(dni => !dni.trim())) {
            toast({
                title: "Error",
                description: "Todos los campos de DNI son requeridos",
                variant: "destructive",
            })
            return
        }

        if (!startDate || !amount || !dueDate) {
            toast({
                title: "Error",
                description: "Todos los campos son requeridos",
                variant: "destructive",
            })
            return
        }

        // Validar que se haya seleccionado un método de pago
        if (!paymentMethod) {
            toast({
                title: "Error",
                description: "Debe seleccionarse un método de pago",
                variant: "destructive",
            })
            return
        }

        // Validar que todos los DNIs sean válidos
        const validUsers = validatedUsers.filter(user => user.isValid)
        if (validUsers.length === 0 || validUsers.length !== clientDnis.filter(dni => dni.trim()).length) {
            toast({
                title: "Error",
                description: "Todos los DNIs deben ser válidos y no contar con planes activos",
                variant: "destructive",
            })
            return
        }

        // Validar que no haya usuarios con errores (planes activos u otros errores)
        const usersWithErrors = validatedUsers.filter(user => user.errorMessage)
        if (usersWithErrors.length > 0) {
            toast({
                title: "Error",
                description: "Corregir los errores marcados",
                variant: "destructive",
            })
            return
        }

        // Validar archivo/notas según método de pago para clientes
        if (user?.role === UserRole.CLIENT) {
            if (paymentMethod === MethodType.TRANSFER && !selectedFile) {
                toast({
                    title: "Error",
                    description: "Debes subir un comprobante para transferencias",
                    variant: "destructive",
                })
                return
            }
            
            if (paymentMethod === MethodType.CASH && !notes.trim()) {
                toast({
                    title: "Error",
                    description: "Las notas son obligatorias para pagos en efectivo",
                    variant: "destructive",
                })
                return
            }
        }

        const amountNum = Number.parseFloat(amount)
        if (isNaN(amountNum) || amountNum <= 0) {
            toast({
                title: "Error",
                description: "El monto base debe ser un número válido mayor a 0",
                variant: "destructive",
            })
            return
        }

        // Validar si el cliente ya tiene un pago activo o pendiente (solo para clientes)
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
            // Obtener array de DNIs validados
            const validDnis = validUsers.map(user => user.dni)
            
            // Determinar el creador del pago según el rol
            let createdByDni: number
            if (user?.role === UserRole.CLIENT) {
                // Para clientes, el creador siempre es el usuario autenticado
                createdByDni = user.dni
            } else if (user?.role === UserRole.ADMIN) {
                // Para admin, el creador es el primer DNI ingresado
                createdByDni = validDnis[0]
            } else {
                throw new Error("Rol de usuario no válido")
            }
            
            await onCreatePayment({
                clientDnis: validDnis,
                createdByDni: createdByDni,
                amount: amountNum,
                createdAt: startDate,
                expiresAt: dueDate,
                method: paymentMethod as MethodType, // Asegurar el tipo ya que validamos que no esté vacío
                notes: notes.trim() || undefined, // Incluir notas si están presentes
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
        // Clear all debounce timers
        debounceTimers.forEach(timer => {
            if (timer) clearTimeout(timer)
        })
        
        // Reset form
        setClientDnis([""])
        setValidatedUsers([])
        setDebounceTimers([])
        setBaseAmount("")
        setStartDate("")
        setAmount("")
        setDueDate("")
        setSelectedFile(null)
        setPreviewUrl(null)
        setNotes("")
        setPaymentMethod("") // Reset método de pago
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
                            {/* DNIs de Clientes */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>DNI de Clientes *</Label>
                                    <Button 
                                type="button"
                                variant="outline" 
                                size="sm"
                                onClick={addDniField}
                                className="flex items-center gap-1"
                            >
                                <span className="text-lg">+</span>
                                Agregar DNI
                            </Button>
                        </div>
                        
                        {clientDnis.map((dni, index) => (
                            <div key={index} className="space-y-2">
                                {/* Fila del input DNI y botón eliminar */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 relative">
                                        <Input
                                            type="number"
                                            maxLength={11}
                                            className={`border ${
                                                validatedUsers[index]?.isValid 
                                                    ? 'border-green-500 focus:ring-green-500' 
                                                    : validatedUsers[index]?.errorMessage 
                                                        ? 'border-red-500 focus:ring-red-500'
                                                        : validatedUsers[index]?.isValidating
                                                            ? 'border-blue-500 focus:ring-blue-500'
                                                            : 'border-gray-300'
                                            }`}
                                            placeholder="Ej: 30123456"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={dni}
                                            onChange={(e) => {
                                                const value = e.target.value
                                                if (/^\d*$/.test(value) && value.length <= 11) {
                                                    updateDni(index, value)
                                                }
                                            }}
                                        />
                                        {validatedUsers[index]?.isValidating && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {clientDnis.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeDniField(index)}
                                            className="text-red-600 hover:text-red-700 h-10 w-10 p-0 flex-shrink-0"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                
                                {/* Fila completa para mensajes de validación */}
                                <div className="w-full">
                                    {/* Validación positiva */}
                                    {validatedUsers[index]?.isValid && (
                                        <div className="flex items-center gap-1 text-sm text-green-600">
                                            <Check className="h-3 w-3" />
                                            <span>{validatedUsers[index].name}</span>
                                        </div>
                                    )}
                                    
                                    {/* Validación negativa */}
                                    {validatedUsers[index]?.errorMessage && !validatedUsers[index]?.isValidating && (
                                        <div className="flex items-center gap-1 text-sm text-red-600">
                                            <AlertCircle className="h-3 w-3" />
                                            <span>{validatedUsers[index].errorMessage}</span>
                                        </div>
                                    )}
                                    
                                    {/* Estado de validación en progreso */}
                                    {validatedUsers[index]?.isValidating && (
                                        <div className="flex items-center gap-1 text-sm text-blue-600">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            <span>Verificando DNI...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Método de Pago */}
                    <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Método de Pago *</Label>
                        {user?.role === UserRole.ADMIN ? (
                            <Select value={paymentMethod || ""} onValueChange={(value: MethodType) => setPaymentMethod(value)}>
                                <SelectTrigger id="paymentMethod">
                                    <SelectValue placeholder="Selecciona método de pago" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={MethodType.CASH}>Efectivo</SelectItem>
                                    <SelectItem value={MethodType.CARD}>Tarjeta</SelectItem>
                                    <SelectItem value={MethodType.TRANSFER}>Transferencia</SelectItem>
                                    <SelectItem value={MethodType.MERCADOPAGO}>MercadoPago</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Select value={paymentMethod || ""} onValueChange={(value: MethodType) => setPaymentMethod(value)}>
                                <SelectTrigger id="paymentMethod">
                                    <SelectValue placeholder="Selecciona método de pago" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={MethodType.TRANSFER}>Transferencia</SelectItem>
                                    <SelectItem value={MethodType.CASH}>Efectivo</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Monto Base Individual - Solo para múltiples usuarios */}
                    {validatedUsers.filter(user => user.isValid).length > 1 && (
                        <div className="space-y-2">
                            <Label htmlFor="baseAmount">Monto por Usuario ($) *</Label>
                            <Input
                                id="baseAmount"
                                type="text"
                                value={baseAmount}
                                onChange={(e) => {
                                    const value = e.target.value
                                    if (/^\d*\.?\d*$/.test(value)) {
                                        setBaseAmount(value)
                                    }
                                }}
                                placeholder="Ej: 30000"
                                inputMode="numeric"
                            />
                        </div>
                    )}

                    {/* Monto Total Calculado */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">
                            {validatedUsers.filter(user => user.isValid).length > 1 
                                ? "Monto Total ($) *" 
                                : "Monto ($) *"
                            }
                        </Label>
                        <Input
                            id="amount"
                            type="text"
                            value={amount}
                            readOnly={validatedUsers.filter(user => user.isValid).length > 1}
                            onChange={validatedUsers.filter(user => user.isValid).length === 1 
                                ? (e) => {
                                    const value = e.target.value
                                    if (/^\d*\.?\d*$/.test(value)) {
                                        setAmount(value)
                                        setBaseAmount(value)
                                    }
                                } : undefined
                            }
                            className={validatedUsers.filter(user => user.isValid).length > 1 
                                ? "bg-muted text-foreground cursor-not-allowed border border-gray-300"
                                : "border border-gray-300"
                            }
                            onFocus={(e) => e.currentTarget.blur()} // evitar edición por foco
                        />
                        {validatedUsers.filter(u => u.isValid).length > 1 && (
                            <p className="text-sm text-gray-600">
                                {validatedUsers.filter(u => u.isValid).length} personas × ${baseAmount || "0"} = ${amount || "0"}
                            </p>
                        )}
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

                            {/* Subir comprobante - Solo para transferencias */}
                            {paymentMethod && paymentMethod === MethodType.TRANSFER && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <FileImage className="h-4 w-4" /> 
                                            Subir Comprobante *
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
                                    </div>
                                </div>
                            )}

                            {/* Notas - Solo mostrar cuando hay un método seleccionado */}
                            {paymentMethod && (
                                <div className="space-y-2">
                                    <Label>
                                        {paymentMethod === MethodType.CASH ? "Notas *" : "Notas (opcional)"}
                                    </Label>
                                    <Textarea 
                                        rows={3} 
                                        className="border border-orange-600" 
                                        value={notes} 
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder={
                                            paymentMethod === MethodType.CASH 
                                                ? "Detalles de cuándo y cómo se realizó el pago en efectivo..." 
                                                : "Notas adicionales sobre el pago..."
                                        }
                                    />
                                </div>
                            )}
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

