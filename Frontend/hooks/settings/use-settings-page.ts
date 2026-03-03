"use client"

import { useAuth } from "@/contexts/auth-provider"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useThemeToggle } from "@/hooks/settings/use-theme"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function useSettingsPage() {
  const { logout } = useAuth()
  const { user } = useRequireAuth()
  const router = useRouter()
  const { toggleTheme, isDark, mounted } = useThemeToggle()

  const [showActivityTimesDialog, setShowActivityTimesDialog] = useState(false)
  const [showMonthlyFeeDialog, setShowMonthlyFeeDialog] = useState(false)
  const [showMaxActivitiesDialog, setShowMaxActivitiesDialog] = useState(false)
  const [showPaymentGracePeriodDialog, setShowPaymentGracePeriodDialog] = useState(false)
  const [showCreateNotificationDialog, setShowCreateNotificationDialog] = useState(false)
  const [showTermsDialog, setShowTermsDialog] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleShowTerms = () => {
    setShowTermsDialog(true)
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
    handleLogout,
    handleShowTerms,
  }
}
