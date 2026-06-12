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
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, Send, AlertTriangle, Users, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { useCreateNotificationDialog } from "@/hooks/settings/use-create-notification-dialog"

interface CreateNotificationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateNotificationDialog({ open, onOpenChange }: CreateNotificationDialogProps) {
    const {
        title,
        setTitle,
        message,
        setMessage,
        isSending,
        isAdmin,
        progress,
        progressPercentage,
        isProgressVisible,
        maxTitleLength,
        maxMessageLength,
        handleSend,
        handleCancel,
        handleOpenChange,
    } = useCreateNotificationDialog(onOpenChange)

    const progressStatItems = [
        { label: "Enviadas", value: progress.sent },
        { label: "Pendientes", value: progress.pending },
        { label: "Total", value: progress.total },
    ]

    // Si no es administrador, mostrar mensaje de acceso denegado
    if (!isAdmin) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="lg:max-w-md">
                    <DialogHeader className="pr-12">
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="size-5 shrink-0 text-destructive" />
                            <span className="min-w-0">Acceso Restringido</span>
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <Alert variant="destructive">
                            <AlertTriangle className="size-4" />
                            <AlertDescription>
                                Solo los administradores pueden enviar notificaciones a los usuarios.
                            </AlertDescription>
                        </Alert>
                    </DialogBody>
                    <DialogFooter className="flex-row items-center gap-2">
                        <Button onClick={() => onOpenChange(false)} className="min-w-0 flex-1">
                            Entendido
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="lg:max-w-xl">
                <DialogHeader className="pr-12">
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="size-5 shrink-0 text-primary" />
                        <span className="min-w-0">Crear Notificación</span>
                    </DialogTitle>
                    <DialogDescription>
                        Crea una notificación que será visible para todos los usuarios en su bandeja de notificaciones.
                    </DialogDescription>
                </DialogHeader>

                <DialogBody className="space-y-3">
                    {isProgressVisible ? (
                        <div className="divide-y rounded-xl border">
                            <div className="space-y-3 p-4">
                                <h4 className="flex items-center gap-2 text-sm font-semibold">
                                    <span className="h-5 w-1 rounded-full bg-primary" />
                                    <span className="min-w-0 flex-1">Progreso de envío</span>
                                    {progress.status === "completed" ? (
                                        <CheckCircle2 className="size-4 shrink-0 text-success" />
                                    ) : (
                                        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                                    )}
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3 text-sm">
                                        <span className="font-medium">
                                            {progress.status === "loading"
                                                ? "Preparando destinatarios"
                                                : progress.status === "completed"
                                                    ? "Envío finalizado"
                                                    : "Enviando notificaciones"}
                                        </span>
                                        <span className="text-muted-foreground">{progressPercentage}%</span>
                                    </div>
                                    <Progress value={progressPercentage} />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 divide-x">
                                {progressStatItems.map(({ label, value }) => (
                                    <div key={label} className="px-3 py-4 text-center">
                                        <p className="text-xl font-semibold">{value}</p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
                                    </div>
                                ))}
                            </div>

                            {(progress.failed > 0 || (progress.status === "sending" && progress.currentRecipientName)) && (
                                <div className="space-y-3 p-4">
                                    {progress.failed > 0 && (
                                        <Alert variant="destructive">
                                            <XCircle className="size-4" />
                                            <AlertDescription>
                                                No se pudieron enviar {progress.failed} notificaciones.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {progress.status === "sending" && progress.currentRecipientName && (
                                        <p className="text-sm text-muted-foreground">
                                            Enviando a {progress.currentRecipientName}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Aviso de alcance */}
                            <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                                <Users className="mt-0.5 size-4 shrink-0" />
                                <p className="min-w-0">
                                    Esta notificación será enviada a <strong className="text-foreground">todos los usuarios</strong> (excepto administradores)
                                    y aparecerá en su sección de notificaciones.
                                </p>
                            </div>

                            {/* Formulario */}
                            <div className="rounded-xl border p-4">
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                    <span className="h-5 w-1 rounded-full bg-primary" />
                                    Contenido de la Notificación
                                </h4>
                                <div className="space-y-4">
                                    {/* Título */}
                                    <div className="space-y-2">
                                        <Label htmlFor="title">
                                            Título *
                                        </Label>
                                        <Input
                                            id="title"
                                            placeholder="Ej: Cambio de horarios"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            maxLength={maxTitleLength}
                                            disabled={isSending}
                                        />
                                        <p className="text-right text-xs text-muted-foreground">
                                            {title.length}/{maxTitleLength}
                                        </p>
                                    </div>

                                    {/* Mensaje */}
                                    <div className="space-y-2">
                                        <Label htmlFor="message">
                                            Mensaje *
                                        </Label>
                                        <Textarea
                                            id="message"
                                            placeholder="Escribe aquí el mensaje de la notificación…"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            maxLength={maxMessageLength}
                                            rows={6}
                                            disabled={isSending}
                                            className="resize-none"
                                        />
                                        <p className="text-right text-xs text-muted-foreground">
                                            {message.length}/{maxMessageLength}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Vista previa */}
                            {(title || message) && (
                                <div className="rounded-xl border border-dashed p-4">
                                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                        <span className="h-5 w-1 rounded-full bg-muted-foreground/40" />
                                        Vista Previa
                                    </h4>
                                    <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                                        {title && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Título:</p>
                                                <p className="font-semibold">{title}</p>
                                            </div>
                                        )}
                                        {message && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Mensaje:</p>
                                                <p className="text-sm text-muted-foreground">{message}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </DialogBody>

                <DialogFooter className="flex-row items-center gap-2">
                    {progress.status === "completed" ? (
                        <Button onClick={handleCancel} className="min-w-0 flex-1">
                            Cerrar
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                onClick={handleCancel}
                                disabled={isSending}
                                className="min-w-0 flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSend}
                                disabled={isSending || !title.trim() || !message.trim()}
                                className="min-w-0 flex-1 px-2"
                            >
                                {isSending ? (
                                    <Loader2 className="mr-1.5 size-4 shrink-0 animate-spin" />
                                ) : (
                                    <Send className="mr-1.5 size-4 shrink-0 max-sm:hidden" />
                                )}
                                {isSending ? "Enviando…" : "Enviar Notificación"}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
