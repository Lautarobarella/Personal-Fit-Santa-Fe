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
import { useToast } from "@/hooks/use-toast"
import { Camera, Check, DollarSign, FileImage, Loader2, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"; // <- en App Router (carpeta `app/`)
import { useEffect, useRef, useState } from "react"
import { useAuth } from "../providers/auth-provider"
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
        file?: File
    }) => Promise<void>
}

export function CreatePaymentDialog({ open, onOpenChange, onCreatePayment }: CreatePaymentDialogProps) {
    const { user } = useAuth()
    const [isCreating, setIsCreating] = useState(false)
    const [selectedClient, setSelectedClient] = useState("")
    const today = new Date()
    const startDateStr = today.toISOString().split("T")[0]

    const oneMonthLater = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
    const maxDay = new Date(oneMonthLater.getFullYear(), oneMonthLater.getMonth() + 1, 0).getDate()
    oneMonthLater.setDate(Math.min(today.getDate(), maxDay))
    const dueDateStr = oneMonthLater.toISOString().split("T")[0]

    const [startDate, setStartDate] = useState(startDateStr)
    const [dueDate, setDueDate] = useState(dueDateStr)

    // Auto-populate fields for client role
    const defaultAmount = user?.role === "client" ? "25000" : ""
    const [amount, setAmount] = useState(defaultAmount)
    
    // Auto-populate fields when dialog opens for client role
    useEffect(() => {
        if (open && user?.role === "client") {
            setSelectedClient(user.dni?.toString() || "")
            setAmount("25000")
        }
    }, [open, user])
    
    const [isUploading, setIsUploading] = useState(false)
    const { toast } = useToast()
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [notes, setNotes] = useState("")


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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
            toast({
                title: "Archivo inválido",
                description: "Debe ser una imagen menor a 5MB",
                variant: "destructive"
            })
            return
        }

        setSelectedFile(file)
        setPreviewUrl(URL.createObjectURL(file))
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

        if (user?.role === "client" && !selectedFile) {
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

        setIsCreating(true)

        try {
            await onCreatePayment({
                clientDni: clientIdParsed,
                amount: amountNum,
                createdAt: startDate,
                expiresAt: dueDate,
                file: selectedFile ?? undefined,
            })

            // Reset form
            setSelectedClient("")
            setStartDate("")
            setAmount("")
            setDueDate("")

            toast({
                title: "Pago creado",
                description: "El pago se ha registrado correctamente",
            })

            //  Cerramos el diálogo y redirigimos
            handleClose()

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
        router.push("/payments")
    }


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">

                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Crear Pago Mensual
                    </DialogTitle>
                    <DialogDescription className="flex">Asigna un pago mensual a un cliente activo</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="client">DNI del Cliente *</Label>
                        <Input
                            id="client"
                            type="number"
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

                    {/* Monto */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto ($) *</Label>
                        <Input
                            id="amount"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="150.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
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
                                const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())

                                // Asegura que sea una fecha válida (ej. 31 de enero + 1 mes → 28 o 29 de febrero)
                                const safeDate = new Date(
                                    nextMonth.getFullYear(),
                                    nextMonth.getMonth(),
                                    Math.min(today.getDate(), new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate())
                                )

                                return safeDate.toISOString().split("T")[0]
                            })()}
                            placeholder="Fecha de vencimiento"
                        />
                    </div>

                    <DialogFooter className="flex gap-3">
                        {
                            < div className="flex gap-2 justify-end mt-4">
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
                                    type="submit" // <- Ahora sí, este es el botón que envía
                                    disabled={isUploading}
                                    className="flex-1"
                                >
                                    {isUploading ? (
                                        <Loader2 className="animate-spin mr-1 h-4 w-2" />
                                    ) : (
                                        <Check className="mr-1 h-4 w-2" />
                                    )}
                                    {isUploading ? "Subiendo..." : "Aceptar"}
                                </Button>
                            </div>
                        }
                        {/* Subir comprobante */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><FileImage className="h-5 w-5" /> Subir Comprobante</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!selectedFile ? (
                                    <div className="border-2 border-dashed p-2 text-center rounded-lg">
                                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="mb-4 text-muted-foreground">Seleccioná o tomá una foto del comprobante</p>
                                        <div className="flex justify-center gap-3">
                                            <Button
                                                variant="outline"
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Upload className="mr-2 h-4 w-4" /> Archivo
                                            </Button>
                                            <Button
                                                variant="outline"
                                                type="button"
                                                onClick={handleCameraCapture}
                                            >
                                                <Camera className="mr-2 h-4 w-4" /> Cámara
                                            </Button>
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                                    </div>
                                ) : (
                                    <div>
                                        <div className="relative border rounded-lg overflow-hidden">
                                            <img src={previewUrl || ""} alt="Comprobante" className="w-full max-h-64 object-contain" />
                                            <Button size="sm" onClick={handleRemoveFile} className="absolute top-2 right-2" variant="destructive">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Notas (opcional)</Label>
                                    <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>

                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    )
}

