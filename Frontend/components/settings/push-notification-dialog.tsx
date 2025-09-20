"use client"

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
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-provider"
import { sendBulkNotification, BulkNotificationRequest } from "@/api/notifications/notificationsApi"
import { UserRole } from "@/lib/types"
import { Bell, Send, AlertTriangle, CheckCircle } from "lucide-react"
import { useState } from "react"

interface PushNotificationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PushNotificationDialog({ open, onOpenChange }: PushNotificationDialogProps) {
    const { toast } = useToast()
    const { user } = useAuth()
    const [title, setTitle] = useState("")
    const [message, setMessage] = useState("")
    const [notificationType, setNotificationType] = useState("general")
    const [saveToDatabase, setSaveToDatabase] = useState(true)
    const [isSending, setIsSending] = useState(false)

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

        try {
            setIsSending(true)

            if (!title.trim()) {
                toast({
                    title: "Error",
                    description: "El título es obligatorio",
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

            const request: BulkNotificationRequest = {
                title: title.trim(),
                body: message.trim(),
                type: notificationType,
                saveToDatabase: saveToDatabase
            }

            const success = await sendBulkNotification(request)

            if (success) {
                toast({
                    title: "✅ Notificación enviada",
                    description: "La notificación ha sido enviada a todos los usuarios",
                    variant: "default",
                })

                // Limpiar formulario y cerrar
                setTitle("")
                setMessage("")
                setNotificationType("general")
                setSaveToDatabase(true)
                onOpenChange(false)
            } else {
                toast({
                    title: "Error",
                    description: "No se pudo enviar la notificación. Inténtalo de nuevo",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error('Error sending notification:', error)
            toast({
                title: "Error",
                description: "Ocurrió un error inesperado al enviar la notificación",
                variant: "destructive",
            })
        } finally {
            setIsSending(false)
        }
    }

    const handleCancel = () => {
        setTitle("")
        setMessage("")
        setNotificationType("general")
        setSaveToDatabase(true)
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
                            Solo los administradores pueden enviar notificaciones push a los usuarios.
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
            <DialogContent className="max-w-4xl h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Generar Notificación Push
                    </DialogTitle>
                    <DialogDescription>
                        Envía una notificación push a todos los usuarios.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-4">
                        {/* Formulario de notificación */}
                        <Card className="m-2">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Contenido de la Notificación
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Título de la notificación</Label>
                                    <Input
                                        id="title"
                                        type="text"
                                        placeholder="Ej: Nueva clase disponible"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        disabled={isSending}
                                        maxLength={100}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        El título aparecerá destacado en la notificación.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Mensaje</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Ej: Se ha añadido una nueva clase para mañana a las 18:00. ¡No te la pierdas!"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        disabled={isSending}
                                        maxLength={maxMessageLength}
                                        rows={4}
                                        className="resize-none"
                                    />
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-muted-foreground">
                                            Este será el cuerpo principal de la notificación.
                                        </p>
                                        <p className={`text-xs ${message.length > maxMessageLength * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                            {message.length}/{maxMessageLength}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Tipo de notificación</Label>
                                    <select
                                        id="type"
                                        value={notificationType}
                                        onChange={(e) => setNotificationType(e.target.value)}
                                        disabled={isSending}
                                        className="w-full p-2 border border-input rounded-md bg-background text-sm"
                                    >
                                        <option value="general">General</option>
                                        <option value="class_reminder">Recordatorio de Clase</option>
                                        <option value="payment_due">Pago Vencido</option>
                                        <option value="promotion">Promoción</option>
                                        <option value="announcement">Anuncio Importante</option>
                                    </select>
                                    <p className="text-xs text-muted-foreground">
                                        El tipo ayuda a categorizar la notificación.
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label htmlFor="save-db">Guardar en historial</Label>
                                        <p className="text-xs text-muted-foreground">
                                            La notificación se guardará en el historial de la app
                                        </p>
                                    </div>
                                    <Switch
                                        id="save-db"
                                        checked={saveToDatabase}
                                        onCheckedChange={setSaveToDatabase}
                                        disabled={isSending}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Vista previa de la notificación */}
                        {(title.trim() || message.trim()) && (
                            <Card className="m-2">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        Vista Previa
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="p-4 border rounded-lg bg-muted/30">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                <Bell className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm truncate">
                                                    {title.trim() || "Título de la notificación"}
                                                </h4>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                    {message.trim() || "Mensaje de la notificación"}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                                        Personal Fit
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ahora
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Así se verá la notificación en el dispositivo del usuario
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Información adicional */}
                        <Card className="m-2">
                            <CardContent className="p-4">
                                <Alert>
                                    <Bell className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Información importante:</strong>
                                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                                            <li>La notificación se enviará a todos los usuarios registrados</li>
                                            <li>Solo usuarios con notificaciones activas la recibirán</li>
                                            <li>El envío puede tardar algunos segundos en completarse</li>
                                            {saveToDatabase && <li>Se guardará una copia en el historial de cada usuario</li>}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>

                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 p-4 border-t border-border">
                        <Button
                            onClick={handleCancel}
                            disabled={isSending}
                            className="flex-1 bg-background border-2 border-border hover:bg-accent hover:text-accent-foreground hover:border-primary/50"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={isSending || !title.trim() || !message.trim()}
                            className="flex-1"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            {isSending ? "Enviando..." : "Enviar Notificación"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}