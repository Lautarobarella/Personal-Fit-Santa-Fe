"use client"

import { fetchBulkNotificationRecipients, newNotification } from "@/api/notifications/notificationsApi"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-provider"
import { useNotificationsContext } from "@/contexts/notifications-provider"
import { UserRole } from "@/lib/types"
import { useState } from "react"

export interface BulkNotificationProgress {
  total: number
  sent: number
  failed: number
  pending: number
  currentRecipientName: string
  status: "idle" | "loading" | "sending" | "completed"
}

const EMPTY_PROGRESS: BulkNotificationProgress = {
  total: 0,
  sent: 0,
  failed: 0,
  pending: 0,
  currentRecipientName: "",
  status: "idle",
}

export function useCreateNotificationDialog(onOpenChange: (open: boolean) => void) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { refetchNotifications } = useNotificationsContext()
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [progress, setProgress] = useState<BulkNotificationProgress>(EMPTY_PROGRESS)

  const maxTitleLength = 100
  const maxMessageLength = 500

  const isAdmin = user?.role === UserRole.ADMIN
  const progressPercentage = progress.total === 0
    ? 0
    : Math.round(((progress.sent + progress.failed) / progress.total) * 100)
  const isProgressVisible = progress.status !== "idle"

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
      setProgress({ ...EMPTY_PROGRESS, status: "loading" })
      const trimmedTitle = title.trim()
      const trimmedMessage = message.trim()
      const response = await fetchBulkNotificationRecipients()
      const recipients = response.recipients || []

      if (recipients.length === 0) {
        setProgress({ ...EMPTY_PROGRESS, status: "completed" })
        toast({
          title: "Sin destinatarios",
          description: "No hay usuarios disponibles para recibir la notificación",
          variant: "default",
        })
        return
      }

      let sent = 0
      let failed = 0
      setProgress({
        total: recipients.length,
        sent,
        failed,
        pending: recipients.length,
        currentRecipientName: "",
        status: "sending",
      })

      for (const recipient of recipients) {
        setProgress((current) => ({
          ...current,
          currentRecipientName: recipient.name,
          status: "sending",
        }))

        try {
          await newNotification({
            title: trimmedTitle,
            message: trimmedMessage,
            userId: String(recipient.id),
          }, { silent: true })
          sent += 1
        } catch (error) {
          failed += 1
          console.error("Error sending notification to recipient:", recipient.id, error)
        }

        setProgress({
          total: recipients.length,
          sent,
          failed,
          pending: recipients.length - sent - failed,
          currentRecipientName: recipient.name,
          status: "sending",
        })
      }

      setProgress({
        total: recipients.length,
        sent,
        failed,
        pending: 0,
        currentRecipientName: "",
        status: "completed",
      })

      toast({
        title: failed > 0 ? "Envío finalizado con errores" : "Notificación enviada",
        description: failed > 0
          ? `Se enviaron ${sent} de ${recipients.length} notificaciones. Fallaron ${failed}.`
          : `La notificación ha sido enviada a ${sent} usuarios`,
        variant: failed > 0 ? "destructive" : "default",
      })

      refetchNotifications()
    } catch (error) {
      console.error("Error sending notification:", error)
      setProgress((current) => ({ ...current, status: "idle" }))
      toast({
        title: "Error",
        description: "Ocurrió un error al enviar la notificación",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const resetDialog = () => {
    setTitle("")
    setMessage("")
    setProgress(EMPTY_PROGRESS)
  }

  const handleCancel = () => {
    if (isSending) return
    resetDialog()
    onOpenChange(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (isSending) return
    if (!open) {
      resetDialog()
    }
    onOpenChange(open)
  }

  return {
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
  }
}
