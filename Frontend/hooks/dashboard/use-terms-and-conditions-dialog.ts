"use client"

import { useAuth } from "@/contexts/auth-provider"
import { generatePersonalizedTermsText, markTermsAsAccepted } from "@/lib/terms-and-conditions-storage"
import { useEffect, useRef, useState } from "react"

export function useTermsAndConditionsDialog(
  open: boolean,
  onAccept: () => void,
  onReject: () => void,
  viewMode: "default" | "readonly" = "default",
) {
  const { user } = useAuth()
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (viewMode === "readonly") return
    const scrollElement = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]")
    if (scrollElement) {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20
      setHasScrolledToBottom(isAtBottom)
    }
  }

  useEffect(() => {
    if (open) {
      setHasScrolledToBottom(false)
    }
  }, [open])

  const handleAccept = () => {
    if (user?.id) {
      markTermsAsAccepted(user.id)
      onAccept()
    }
  }

  const handleReject = () => {
    onReject()
  }

  const personalizedText = user ? generatePersonalizedTermsText(user) : ""

  return {
    user,
    hasScrolledToBottom,
    scrollAreaRef,
    handleScroll,
    handleAccept,
    handleReject,
    personalizedText,
  }
}
