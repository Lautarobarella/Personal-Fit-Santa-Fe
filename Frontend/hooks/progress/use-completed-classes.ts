"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useToast } from "@/hooks/use-toast"
import { fetchCurrentUserById } from "@/api/clients/usersApi"
import { ActivityStatus, UserRole } from "@/types"
import type { UserDetailInfo } from "@/types"

export function useCompletedClasses() {
  const { user } = useRequireAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [clientDetail, setClientDetail] = useState<UserDetailInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    if (user.role !== UserRole.CLIENT) {
      router.push("/dashboard")
      return
    }

    const loadDetail = async () => {
      setIsLoading(true)
      try {
        const detail = await fetchCurrentUserById(user.id)
        setClientDetail(detail)
      } catch {
        toast({
          title: "Error",
          description: "No se pudieron cargar tus clases completadas.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDetail()
  }, [router, toast, user])

  const completedActivities = useMemo(() => {
    if (!clientDetail) return []

    return clientDetail.listActivity
      .filter((activity) => activity.activityStatus === ActivityStatus.COMPLETED)
      .sort((first, second) => {
        const firstTime = first.date ? new Date(first.date).getTime() : 0
        const secondTime = second.date ? new Date(second.date).getTime() : 0
        return secondTime - firstTime
      })
  }, [clientDetail])

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A"
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date))
  }

  const formatTime = (date: Date | string | null) => {
    if (!date) return "--:--"
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  return {
    user,
    router,
    isLoading,
    clientDetail,
    completedActivities,
    formatDate,
    formatTime,
  }
}
