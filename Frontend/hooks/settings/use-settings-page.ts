"use client"

import { deleteUserAvatar, uploadUserAvatar } from "@/api/clients/usersApi"
import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useThemeToggle } from "@/hooks/settings/use-theme"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function useSettingsPage() {
  const { logout, refreshUser } = useAuth()
  const { user } = useRequireAuth()
  const router = useRouter()
  const { toggleTheme, isDark, mounted } = useThemeToggle()
  const { toast } = useToast()

  const [showActivityTimesDialog, setShowActivityTimesDialog] = useState(false)
  const [showMonthlyFeeDialog, setShowMonthlyFeeDialog] = useState(false)
  const [showMaxActivitiesDialog, setShowMaxActivitiesDialog] = useState(false)
  const [showPaymentGracePeriodDialog, setShowPaymentGracePeriodDialog] = useState(false)
  const [showCreateNotificationDialog, setShowCreateNotificationDialog] = useState(false)
  const [showTermsDialog, setShowTermsDialog] = useState(false)
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleShowTerms = () => {
    setShowTermsDialog(true)
  }

  const handleAvatarUpload = async (file: File) => {
    if (!user?.id) {
      return
    }

    setIsUpdatingAvatar(true)
    try {
      await uploadUserAvatar(user.id, file)
      await refreshUser()
      toast({
        title: "Foto actualizada",
        description: "La foto de perfil se guardó correctamente.",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
    } finally {
      setIsUpdatingAvatar(false)
    }
  }

  const handleAvatarDelete = async () => {
    if (!user?.id) {
      return
    }

    setIsUpdatingAvatar(true)
    try {
      await deleteUserAvatar(user.id)
      await refreshUser()
      toast({
        title: "Foto eliminada",
        description: "Se restauraron tus iniciales como avatar.",
      })
    } catch (error) {
      console.error("Error deleting avatar:", error)
    } finally {
      setIsUpdatingAvatar(false)
    }
  }

  return {
    user,
    router,
    toggleTheme,
    isDark,
    mounted,
    showActivityTimesDialog,
    setShowActivityTimesDialog,
    showMonthlyFeeDialog,
    setShowMonthlyFeeDialog,
    showMaxActivitiesDialog,
    setShowMaxActivitiesDialog,
    showPaymentGracePeriodDialog,
    setShowPaymentGracePeriodDialog,
    showCreateNotificationDialog,
    setShowCreateNotificationDialog,
    showTermsDialog,
    setShowTermsDialog,
    isUpdatingAvatar,
    handleLogout,
    handleShowTerms,
    handleAvatarUpload,
    handleAvatarDelete,
  }
}
