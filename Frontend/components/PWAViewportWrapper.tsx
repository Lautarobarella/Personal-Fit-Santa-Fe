"use client"

import { usePWAViewportFix } from "@/hooks/use-pwa-viewport"
import type React from "react"

interface PWAViewportWrapperProps {
  children: React.ReactNode
}

export function PWAViewportWrapper({ children }: PWAViewportWrapperProps) {
  usePWAViewportFix()
  
  return <>{children}</>
}