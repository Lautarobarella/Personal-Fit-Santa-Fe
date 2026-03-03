"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useToast } from "@/hooks/use-toast"
import { fetchCurrentUserById } from "@/api/clients/usersApi"
import { ActivityStatus, UserRole } from "@/types"
import type { UserDetailInfo } from "@/types"

export function useProgress() {
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
          description: "No se pudo cargar tu progreso.",
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

  const completedWithSummary = useMemo(() => {
    return completedActivities.filter((activity) => !!activity.summary)
  }, [completedActivities])

  const averageEffort = useMemo(() => {
    if (completedWithSummary.length === 0) return 0

    const totalEffort = completedWithSummary.reduce((accumulated, activity) => {
      return accumulated + (activity.summary?.effortLevel ?? 0)
    }, 0)

    return Math.round((totalEffort / completedWithSummary.length) * 10) / 10
  }, [completedWithSummary])

  return {
    user,
    router,
    isLoading,
    clientDetail,
    completedActivities,
    completedWithSummary,
    averageEffort,
  }
}
