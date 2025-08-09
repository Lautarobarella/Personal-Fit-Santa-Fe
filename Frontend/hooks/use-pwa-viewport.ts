"use client"

import { useEffect } from 'react'

export function usePWAViewportFix() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Recalibrar viewport cuando la app vuelve a ser visible
        setTimeout(() => {
          document.body.classList.add('pwa-recalibrate')
          
          // Forzar recálculo del viewport
          const vh = window.innerHeight * 0.01
          document.documentElement.style.setProperty('--vh', `${vh}px`)
          
          setTimeout(() => {
            document.body.classList.remove('pwa-recalibrate')
          }, 100)
        }, 50)
      }
    }

    const handleResize = () => {
      // Actualizar viewport height dinámicamente
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    // Detectar cuando la app vuelve a estar visible (regreso de MercadoPago)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    // Configuración inicial
    handleResize()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])
}