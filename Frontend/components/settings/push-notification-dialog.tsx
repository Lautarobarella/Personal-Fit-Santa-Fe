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
import { useToast } from "@/hooks/use-toast"
import { Bell, Send } from "lucide-react"
import { useState } from "react"

interface PushNotificationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PushNotificationDialog({ open, onOpenChange }: PushNotificationDialogProps) {
    const { toast } = useToast()
    const [title, setTitle] = useState("")
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)

    const maxMessageLength = 500

    const handleSend = async () => {
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

            // TODO: Aquí se implementará la lógica de envío
            toast({
                title: "Función en desarrollo",
                description: "La funcionalidad de envío se implementará próximamente",
                variant: "default",
            })

            // Limpiar formulario y cerrar
            setTitle("")
            setMessage("")
            onOpenChange(false)
        } catch (error) {
            console.error('Error sending notification:', error)
            toast({
                title: "Error",
                description: "No se pudo enviar la notificación",
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
                            </CardContent>
                        </Card>

                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 p-4 border-t border-border">
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
                            className="flex-1"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            {isSending ? "Enviando..." : "Enviar"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}