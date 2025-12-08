"use client"

import { createBulkNotification } from "@/api/notifications/notificationsApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-provider"
import { useNotificationsContext } from "@/contexts/notifications-provider"
import { UserRole } from "@/lib/types"
import { Bell, Send, AlertTriangle, Users, MessageSquare } from "lucide-react"
import { useState } from "react"

interface CreateNotificationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateNotificationDialog({ open, onOpenChange }: CreateNotificationDialogProps) {
    const { toast } = useToast()
    const { user } = useAuth()
    const { refetchNotifications } = useNotificationsContext()
    const [title, setTitle] = useState("")
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)

    const maxTitleLength = 100
    const maxMessageLength = 500

    // Verificar si el usuario es administrador
    const isAdmin = user?.role === UserRole.ADMIN

    const handleSend = async () => {
        if (!isAdmin) {
            toast({
                title: "Acceso denegado",
                description: "Solo los administradores pueden enviar notificaciones",
                variant: "destructive",
            })
            return
        }

        // Validaciones
        if (!title.trim()) {
            toast({
                title: "Error",
                description: "El título es obligatorio",
                variant: "destructive",
            })
            return
        }

        if (title.length > maxTitleLength) {
            toast({
                title: "Error",
                description: `El título no puede exceder ${maxTitleLength} caracteres`,
                variant: "destructive",
            })
            return
        }

        if (!message.trim()) {
            toast({
                title: "Error",
                description: "El mensaje es obligatorio",
                variant: "destructive",
            })
            return
        }

        if (message.length > maxMessageLength) {
            toast({
                title: "Error",
                description: `El mensaje no puede exceder ${maxMessageLength} caracteres`,
                variant: "destructive",
            })
            return
        }

        try {
            setIsSending(true)

            const response = await createBulkNotification(title.trim(), message.trim())

            toast({
                title: "✅ Notificación enviada",
                description: `La notificación ha sido enviada a ${response.count || 'todos los'} usuarios`,
                variant: "default",
            })

            // Limpiar formulario y cerrar
            setTitle("")
            setMessage("")
            onOpenChange(false)

            // Recargar notificaciones
            refetchNotifications()

        } catch (error) {
            console.error('Error sending notification:', error)
            toast({
                title: "Error",
                description: "Ocurrió un error al enviar la notificación",
                variant: "destructive",
            })
        } finally {
            setIsSending(false)
        }
    }

    const handleCancel = () => {
        setTitle("")
        setMessage("")
        onOpenChange(false)
    }

    // Si no es administrador, mostrar mensaje de acceso denegado
    if (!isAdmin) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Acceso Restringido
                        </DialogTitle>
                    </DialogHeader>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Solo los administradores pueden enviar notificaciones a los usuarios.
                        </AlertDescription>
                    </Alert>
                    <div className="flex justify-end pt-4">
                        <Button onClick={() => onOpenChange(false)}>
                            Entendido
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Crear Notificación
                    </DialogTitle>
                    <DialogDescription>
                        Crea una notificación que será visible para todos los usuarios en su bandeja de notificaciones.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-4">
                    {/* Info Card */}
                    <Alert>
                        <Users className="h-4 w-4" />
                        <AlertDescription>
                            Esta notificación será enviada a <strong>todos los usuarios</strong> (excepto administradores) y aparecerá en su sección de notificaciones.
                        </AlertDescription>
                    </Alert>

                    {/* Formulario */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Contenido de la Notificación
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                    placeholder="Escribe aquí el mensaje de la notificación..."
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
                        </CardContent>
                    </Card>

                    {/* Vista previa */}
                    {(title || message) && (
                        <Card className="border-2 border-dashed">
                            <CardHeader>
                                <CardTitle className="text-sm">Vista Previa</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {title && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Título:</p>
                                        <p className="font-semibold">{title}</p>
                                    </div>
                                )}
                                {message && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Mensaje:</p>
                                        <p className="text-sm text-gray-600">{message}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Footer con botones */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={isSending || !title.trim() || !message.trim()}
                        className="gap-2"
                    >
                        {isSending ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                Enviar Notificación
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
