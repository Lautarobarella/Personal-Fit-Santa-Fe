'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function useThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const isDark = theme === 'dark'

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark,
    mounted
  }
}
