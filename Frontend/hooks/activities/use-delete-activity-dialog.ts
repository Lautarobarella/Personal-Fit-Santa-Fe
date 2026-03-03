"use client"

import { ActivityType } from "@/lib/types"
import { useState } from "react"

export function useDeleteActivityDialog(
  activity: ActivityType,
  onDelete: (activityId: number) => void,
  onOpenChange: (open: boolean) => void,
) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await onDelete(activity.id)
      onOpenChange(false)
    } catch (error) {
      console.error("Error in delete dialog:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const hasParticipants = activity.currentParticipants > 0
  const isPastActivity = new Date(activity.date) < new Date()

  return {
    isDeleting,
    handleDelete,
    hasParticipants,
    isPastActivity,
  }
}
