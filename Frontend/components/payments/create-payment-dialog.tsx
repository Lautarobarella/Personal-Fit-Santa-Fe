"use client"

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
import { formatFileSize } from "@/lib/file-compression"
import { MethodType, UserRole } from "@/lib/types"
import { AlertCircle, Camera, Check, DollarSign, FileImage, Loader2, Upload, X } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { Textarea } from "../ui/textarea"
import { useCreatePaymentDialog } from "@/hooks/payments/use-create-payment-dialog"

interface CreatePaymentDialogProps {
    open: boolean
    onOpenChange: (_open: boolean) => void
    paymentFlowMode?: "default" | "individual" | "group"
    expectedDniCount?: number
    onCreatePayment: (_payment: {
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

export function CreatePaymentDialog({
    open,
    onOpenChange,
    onCreatePayment,
    paymentFlowMode = "default",
    expectedDniCount,
}: CreatePaymentDialogProps) {
    const {
        user,
        isIndividualFlow,
        isGroupFlow,
        hasFixedDniCount,
        isCreating,
        canSubmitByDniCount,
        completedDniCount,
        validUsersCount,
        clientDnis,
        validatedUsers,
        baseAmount,
        setBaseAmount,
        amount,
        setAmount,
        startDate,
        dueDate,
        paymentMethod,
        setPaymentMethod,
        notes,
        setNotes,
        selectedFile,
        previewUrl,
        fileInputRef,
        addDniField,
        removeDniField,
        updateDni,
        handleFileSelect,
        handleFilePickerOpen,
        handleCameraCapture,
        handleRemoveFile,
        handleSubmit,
        handleClose,
    } = useCreatePaymentDialog(open, onOpenChange, onCreatePayment, {
        paymentFlowMode,
        expectedDniCount,
    })


    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">

                <DialogHeader>
                    <DialogTitle className="text-left flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Crear Pago Mensual
                    </DialogTitle>
                    <DialogDescription className="text-left">
                        {isIndividualFlow
                            ? "Asigna un pago mensual individual"
                            : isGroupFlow && expectedDniCount
                                ? `Asigna un pago grupal para ${expectedDniCount} clientes`
                                : "Asigna un pago mensual a un cliente activo"}
                    </DialogDescription>
                </DialogHeader>

                <Card className="m-2">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* DNIs de Clientes */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>DNI de Clientes *</Label>
                                    {!hasFixedDniCount && (
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
                                    )}
                                </div>
                                {isGroupFlow && expectedDniCount && (
                                    <p className="text-xs text-muted-foreground">
                                        Debes completar {expectedDniCount} DNI(s): {completedDniCount}/{expectedDniCount} cargados, {validUsersCount}/{expectedDniCount} validados.
                                    </p>
                                )}

                                {clientDnis.map((dni, index) => (
                                    <div key={index} className="space-y-2">
                                        {/* Fila del input DNI y botón eliminar */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 relative">
                                                <Input
                                                    type="number"
                                                    maxLength={11}
                                                    className={`border ${validatedUsers[index]?.isValid
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

                                            {!hasFixedDniCount && clientDnis.length > 1 && (
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
                                            <SelectItem value={MethodType.TRANSFER}>Transferencia</SelectItem>
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
                                    readOnly={validatedUsers.filter(user => user.isValid).length !== 1}
                                    onChange={(e) => {
                                        if (validatedUsers.filter(user => user.isValid).length === 1) {
                                            const value = e.target.value
                                            if (/^\d*\.?\d*$/.test(value)) {
                                                setAmount(value)
                                                setBaseAmount(value)
                                            }
                                        }
                                    }}
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
                                    value={startDate}
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
                                    value={dueDate}
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
                                                        previewUrl ? (
                                                            <img src={previewUrl} alt="Comprobante" className="w-full max-h-64 object-contain" />
                                                        ) : (
                                                            <div className="p-8 text-center text-sm text-muted-foreground">
                                                                Procesando comprobante...
                                                            </div>
                                                        )
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
                                                onClick={handleFilePickerOpen}
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
                            disabled={isCreating || !canSubmitByDniCount}
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
