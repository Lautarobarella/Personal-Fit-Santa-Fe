"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogBody,
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
import { Textarea } from "../ui/textarea"
import { useCreatePaymentDialog } from "@/hooks/payments/use-create-payment-dialog"

interface CreatePaymentDialogProps {
    open: boolean
    onOpenChange: (_open: boolean) => void
    paymentFlowMode?: "default" | "individual" | "group"
    expectedDniCount?: number
    onCreatePayment: (_payment: {
        clientDnis: number[]
        expectedMonthlyFee: number
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
        canSubmitPayment,
        isAuthenticatedClientDniLocked,
        monthlyFeeError,
        completedDniCount,
        validUsersCount,
        clientDnis,
        dniFieldIds,
        validatedUsers,
        baseAmount,
        amount,
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
            <DialogContent>
                <DialogHeader className="pr-12">
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="size-5 shrink-0 text-primary" />
                        <span className="min-w-0">Crear Pago Mensual</span>
                    </DialogTitle>
                    <DialogDescription>
                        {isIndividualFlow
                            ? "Asigna un pago mensual individual"
                            : isGroupFlow && expectedDniCount
                                ? `Asigna un pago grupal para ${expectedDniCount} clientes`
                                : "Asigna un pago mensual a un cliente activo"}
                    </DialogDescription>
                </DialogHeader>

                <DialogBody className="space-y-3">
                    {monthlyFeeError && (
                        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                            <AlertCircle className="size-4 shrink-0" />
                            <span>{monthlyFeeError}</span>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* DNIs de Clientes */}
                        <div className="rounded-xl border p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <h4 className="flex items-center gap-2 text-sm font-semibold">
                                    <span className="h-5 w-1 rounded-full bg-primary" />
                                    DNI de Clientes <span className="text-destructive">*</span>
                                </h4>
                                {!hasFixedDniCount && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addDniField}
                                        className="flex shrink-0 items-center gap-1"
                                    >
                                        <span className="text-lg">+</span>
                                        Agregar DNI
                                    </Button>
                                )}
                            </div>
                            {isGroupFlow && expectedDniCount && (
                                <p className="mb-3 text-xs text-muted-foreground">
                                    Debes completar {expectedDniCount} DNI(s): {completedDniCount}/{expectedDniCount} cargados, {validUsersCount}/{expectedDniCount} validados.
                                </p>
                            )}

                            <div className="space-y-3">
                                {clientDnis.map((dni, index) => (
                                    <div key={dniFieldIds[index]} className="space-y-2">
                                        {/* Fila del input DNI y botón eliminar */}
                                        <div className="flex items-center gap-2">
                                            <div className="relative min-w-0 flex-1">
                                                <Input
                                                    type="number"
                                                    maxLength={11}
                                                    className={`border ${validatedUsers[index]?.isValid
                                                        ? 'border-green-500 focus:ring-green-500'
                                                        : 'border-border focus:ring-ring'
                                                        }`}
                                                    placeholder="Ej: 30123456"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    value={dni}
                                                    readOnly={isAuthenticatedClientDniLocked && index === 0}
                                                    aria-readonly={isAuthenticatedClientDniLocked && index === 0}
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        if (/^\d*$/.test(value) && value.length <= 11) {
                                                            updateDni(index, value)
                                                        }
                                                    }}
                                                />
                                                {validatedUsers[index]?.isValidating && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>

                                            {!hasFixedDniCount && clientDnis.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeDniField(index)}
                                                    className="size-10 shrink-0 p-0 text-destructive hover:text-destructive"
                                                >
                                                    <X className="size-4" />
                                                </Button>
                                            )}
                                        </div>

                                        {/* Fila completa para mensajes de validación */}
                                        <div className="w-full">
                                            {/* Validación positiva */}
                                            {validatedUsers[index]?.isValid && (
                                                <div className="flex items-center gap-1 text-sm text-green-600">
                                                    <Check className="size-3 shrink-0" />
                                                    <span>{validatedUsers[index].name}</span>
                                                </div>
                                            )}

                                            {/* Validación negativa */}
                                            {validatedUsers[index]?.errorMessage && !validatedUsers[index]?.isValidating && (
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <AlertCircle className="size-3 shrink-0" />
                                                    <span>{validatedUsers[index].errorMessage}</span>
                                                </div>
                                            )}

                                            {/* Estado de validación en progreso */}
                                            {validatedUsers[index]?.isValidating && (
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Loader2 className="size-3 shrink-0 animate-spin" />
                                                    <span>Verificando DNI…</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Detalles del pago: método, montos y fechas */}
                        <div className="rounded-xl border p-4">
                            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
                                Detalles del Pago
                            </h4>

                            <div className="space-y-4">
                                {/* Método de Pago */}
                                <div className="space-y-2">
                                    <Label htmlFor="paymentMethod">
                                        Método de Pago <span className="text-destructive">*</span>
                                    </Label>
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
                                        <Label htmlFor="baseAmount">
                                            Monto por Usuario ($) <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="baseAmount"
                                            type="text"
                                            value={baseAmount}
                                            readOnly
                                            aria-readonly="true"
                                            placeholder="Monto por usuario"
                                            inputMode="numeric"
                                            className="cursor-not-allowed bg-muted text-foreground"
                                        />
                                    </div>
                                )}

                                {/* Monto Total Calculado */}
                                <div className="space-y-2">
                                    <Label htmlFor="amount">
                                        {validatedUsers.filter(user => user.isValid).length > 1
                                            ? "Monto Total ($)"
                                            : "Monto ($)"
                                        }{" "}
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="text"
                                        value={amount}
                                        readOnly
                                        aria-readonly="true"
                                        className="cursor-not-allowed bg-muted text-foreground"
                                    />
                                    {validatedUsers.filter(u => u.isValid).length > 1 && (
                                        <p className="text-sm text-muted-foreground">
                                            {validatedUsers.filter(u => u.isValid).length} personas × ${baseAmount || "0"} = ${amount || "0"}
                                        </p>
                                    )}
                                </div>

                                {/* Fechas de inicio y vencimiento */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">
                                            Fecha de inicio <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="startDate"
                                            type="text"
                                            readOnly
                                            value={startDate}
                                            placeholder="Fecha de inicio"
                                            className="cursor-not-allowed bg-muted text-foreground"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="dueDate">
                                            Fecha de vencimiento <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="dueDate"
                                            type="text"
                                            readOnly
                                            value={dueDate}
                                            placeholder="Fecha de vencimiento"
                                            className="cursor-not-allowed bg-muted text-foreground"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Subir comprobante - Solo para transferencias */}
                        {paymentMethod && paymentMethod === MethodType.TRANSFER && (
                            <div className="rounded-xl border p-4">
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                    <span className="h-5 w-1 rounded-full bg-primary" />
                                    Subir Comprobante <span className="text-destructive">*</span>
                                </h4>

                                <div className="space-y-4">
                                    {!selectedFile ? (
                                        <div className="rounded-xl border-2 border-dashed p-6 text-center">
                                            <Upload className="mx-auto mb-4 size-12 text-muted-foreground" />
                                            <p className="mb-4 text-muted-foreground">Seleccioná o tomá una foto del comprobante</p>
                                            <p className="mb-4 text-xs text-muted-foreground">Formatos soportados: JPG, PNG, WebP, PDF</p>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*,.pdf"
                                                aria-label="Seleccionar comprobante de pago"
                                                className="hidden"
                                                onChange={handleFileSelect}
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="relative overflow-hidden rounded-xl border">
                                                {selectedFile.type.startsWith('image/') ? (
                                                    previewUrl ? (
                                                        <img src={previewUrl} alt="Comprobante" className="max-h-64 w-full object-contain" />
                                                    ) : (
                                                        <div className="p-8 text-center text-sm text-muted-foreground">
                                                            Procesando comprobante…
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="p-8 text-center">
                                                        <FileImage className="mx-auto mb-4 size-16 text-muted-foreground" />
                                                        <p className="font-medium">{selectedFile.name}</p>
                                                        <p className="text-sm text-muted-foreground">Archivo PDF</p>
                                                    </div>
                                                )}
                                                <Button size="sm" onClick={handleRemoveFile} className="absolute right-2 top-2" variant="destructive">
                                                    <X className="size-4" />
                                                </Button>
                                            </div>
                                            <p className="mt-2 text-sm text-muted-foreground">{selectedFile.name} ({formatFileSize(selectedFile.size)})</p>
                                        </div>
                                    )}

                                    {/* Botones de subida - aparecen siempre */}
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={handleFilePickerOpen}
                                            disabled={isCreating}
                                            className="min-w-0 flex-1"
                                        >
                                            <Upload className="mr-1.5 size-4 shrink-0" />
                                            Archivo
                                        </Button>
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={handleCameraCapture}
                                            disabled={isCreating}
                                            className="min-w-0 flex-1"
                                        >
                                            <Camera className="mr-1.5 size-4 shrink-0" />
                                            Cámara
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notas - Solo mostrar cuando hay un método seleccionado */}
                        {paymentMethod && (
                            <div className="rounded-xl border p-4">
                                <Label className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                    <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
                                    {paymentMethod === MethodType.CASH
                                        ? <>Notas <span className="text-destructive">*</span></>
                                        : "Notas (opcional)"}
                                </Label>
                                <Textarea
                                    rows={3}
                                    className="resize-none text-sm"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={
                                        paymentMethod === MethodType.CASH
                                            ? "Detalles de cuándo y cómo se realizó el pago en efectivo…"
                                            : "Notas adicionales sobre el pago…"
                                    }
                                />
                            </div>
                        )}
                    </form>
                </DialogBody>

                <DialogFooter className="flex-row items-center gap-3">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={handleClose}
                        disabled={isCreating}
                        className="min-w-0 flex-1"
                    >
                        Cancelar
                    </Button>

                    <Button
                        type="submit"
                        disabled={isCreating || !canSubmitPayment}
                        className="min-w-0 flex-1"
                        onClick={handleSubmit}
                    >
                        {isCreating ? (
                            <Loader2 className="mr-1.5 size-4 shrink-0 animate-spin" />
                        ) : (
                            <Check className="mr-1.5 size-4 shrink-0 max-sm:hidden" />
                        )}
                        {isCreating ? "Creando…" : "Aceptar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
