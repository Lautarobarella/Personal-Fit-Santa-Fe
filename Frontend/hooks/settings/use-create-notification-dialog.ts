"use client"

import { createBulkNotification } from "@/api/notifications/notificationsApi"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-provider"
import { useNotificationsContext } from "@/contexts/notifications-provider"
import { UserRole } from "@/lib/types"
import { useState } from "react"

export function useCreateNotificationDialog(onOpenChange: (open: boolean) => void) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { refetchNotifications } = useNotificationsContext()
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const maxTitleLength = 100
  const maxMessageLength = 500

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

    if (!title.trim()) {
      toast({ title: "Error", description: "El título es obligatorio", variant: "destructive" })
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
      toast({ title: "Error", description: "El mensaje es obligatorio", variant: "destructive" })
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
        description: `La notificación ha sido enviada a ${response.count || "todos los"} usuarios`,
        variant: "default",
      })

      setTitle("")
      setMessage("")
      onOpenChange(false)
      refetchNotifications()
    } catch (error) {
      console.error("Error sending notification:", error)
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

  return {
    title,
    setTitle,
    message,
    setMessage,
    isSending,
    isAdmin,
    maxTitleLength,
    maxMessageLength,
    handleSend,
    handleCancel,
  }
}
