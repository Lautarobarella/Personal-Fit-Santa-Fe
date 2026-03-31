"use client"

import { approvePendingUser, fetchPendingUserVerifications, rejectPendingUser } from "@/api/clients/usersApi"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useToast } from "@/hooks/use-toast"
import { UserRole, type UserType } from "@/types"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

export function useUserVerify() {
  const { user } = useRequireAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isOnCooldown, setIsOnCooldown] = useState(false)
  const [show, setShow] = useState(true)
  const [reviewedCount, setReviewedCount] = useState(0)

  const [pendingUsers, setPendingUsers] = useState<UserType[]>([])
  const [userQueue, setUserQueue] = useState<number[]>([])
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  const initialPendingCount = useRef<number | null>(null)
  const hasInitialized = useRef(false)

  const VERIFICATION_COOLDOWN = 2000

  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      router.replace("/clients")
    }
  }, [router, user])

  useEffect(() => {
    const loadPendingUsers = async () => {
      setLoading(true)
      try {
        const response = await fetchPendingUserVerifications()
        const users: UserType[] = Array.isArray(response) ? response : []

        const sortedUsers = users.sort((a, b) => {
          return new Date(a.joinDate ?? 0).getTime() - new Date(b.joinDate ?? 0).getTime()
        })

        setPendingUsers(sortedUsers)

        const queue = sortedUsers.map((pendingUser) => pendingUser.id)
        setUserQueue(queue)
        setCurrentUserId(queue[0] || null)
        initialPendingCount.current = queue.length
        hasInitialized.current = true
      } finally {
        setLoading(false)
      }
    }

    loadPendingUsers()
  }, [])

  const currentUser = useMemo(() => {
    if (!currentUserId) return null
    return pendingUsers.find((pendingUser) => pendingUser.id === currentUserId) ?? null
  }, [currentUserId, pendingUsers])

  const moveToNextUser = () => {
    setUserQueue((previousQueue) => {
      const nextQueue = previousQueue.slice(1)
      setCurrentUserId(nextQueue[0] || null)
      return nextQueue
    })
  }

  const handleStatusUpdate = async (status: "approved" | "rejected") => {
    if (!currentUser || isOnCooldown) {
      return
    }

    setIsProcessing(true)
    setIsOnCooldown(true)

    try {
      if (status === "approved") {
        await approvePendingUser(currentUser.id)
      } else {
        await rejectPendingUser(currentUser.id)
      }

      toast({
        title: status === "approved" ? "Usuario aprobado" : "Usuario rechazado",
        description:
          status === "approved"
            ? `${currentUser.firstName} ${currentUser.lastName} fue validado correctamente.`
            : `${currentUser.firstName} ${currentUser.lastName} fue rechazado.`,
      })

      setShow(false)

      setTimeout(() => {
        setPendingUsers((previousUsers) => previousUsers.filter((pendingUser) => pendingUser.id !== currentUser.id))
        moveToNextUser()
        setReviewedCount((previousCount) => previousCount + 1)
        setShow(true)
      }, 300)

      setTimeout(() => setIsOnCooldown(false), VERIFICATION_COOLDOWN)
    } catch {
      setIsOnCooldown(false)
      toast({
        title: "Error",
        description: "No se pudo procesar la verificacion del usuario",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const isVerificationComplete =
    !loading && userQueue.length === 0 && initialPendingCount.current !== null && hasInitialized.current

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) {
      return "Sin fecha"
    }

    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date))
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case UserRole.CLIENT:
        return "Cliente"
      case UserRole.TRAINER:
        return "Entrenador"
      default:
        return role
    }
  }

  return {
    user,
    router,
    loading,
    show,
    isProcessing,
    isOnCooldown,
    reviewedCount,
    userQueue,
    currentUser,
    initialPendingCount,
    isVerificationComplete,
    formatDate,
    getRoleText,
    handleStatusUpdate,
  }
}