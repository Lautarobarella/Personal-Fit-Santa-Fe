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
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="size-4 text-destructive" />
                            Acceso Restringido
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
                    <DialogFooter>
                        <Button onClick={() => onOpenChange(false)}>
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
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Bell className="size-4 text-primary" />
                        </span>
                        Crear Notificación
                    </DialogTitle>
                    <DialogDescription>
                        Crea una notificación que será visible para todos los usuarios en su bandeja de notificaciones.
                    </DialogDescription>
                </DialogHeader>

                <DialogBody className="space-y-4">
                    {isProgressVisible ? (
                        <div className="divide-y rounded-xl border">
                            <div className="space-y-3 p-4">
                                <h4 className="flex items-center gap-2 text-sm font-semibold">
                                    {progress.status === "completed" ? (
                                        <CheckCircle2 className="size-4 text-success" />
                                    ) : (
                                        <Loader2 className="size-4 animate-spin text-primary" />
                                    )}
                                    Progreso de envío
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
                            <Alert>
                                <Users className="size-4" />
                                <AlertDescription>
                                    Esta notificación será enviada a <strong>todos los usuarios</strong> (excepto administradores)
                                    y aparecerá en su sección de notificaciones.
                                </AlertDescription>
                            </Alert>

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
                                        <p className="text-xs text-muted-foreground text-right">
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
                                        <p className="text-xs text-muted-foreground text-right">
                                            {message.length}/{maxMessageLength}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Vista previa */}
                            {(title || message) && (
                                <div className="rounded-xl border border-dashed p-4">
                                    <h4 className="mb-2 text-sm font-semibold">Vista Previa</h4>
                                    <div className="space-y-2">
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

                <DialogFooter>
                    {progress.status === "completed" ? (
                        <Button onClick={handleCancel} className="flex-1">
                            Cerrar
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isSending}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSend}
                                disabled={isSending || !title.trim() || !message.trim()}
                                className="flex-1 gap-2"
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Enviando…
                                    </>
                                ) : (
                                    <>
                                        <Send className="size-4" />
                                        Enviar Notificación
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
