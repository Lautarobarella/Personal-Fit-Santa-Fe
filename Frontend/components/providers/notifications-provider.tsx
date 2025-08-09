"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "./auth-provider"
import { getUnreadCount } from "@/api/notifications/notificationsApi"
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

interface NotificationsContextType {
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
  forceUpdateCount: () => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [stompClient, setStompClient] = useState<Client | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())
  const lastWebSocketUpdate = useRef<number>(0)
  const isUpdatingFromWebSocket = useRef<boolean>(false)

  const fetchUnreadCount = useCallback(async () => {
    if (user?.id && !isUpdatingFromWebSocket.current) {
      try {
        const count = await getUnreadCount(user.id)
        setUnreadCount(count)
        console.log('🔔 Contador de notificaciones actualizado desde API:', count)
      } catch (error) {
        console.error('Error fetching unread count:', error)
        setUnreadCount(0)
      }
    }
  }, [user?.id])

  const refreshUnreadCount = useCallback(async () => {
    await fetchUnreadCount()
  }, [fetchUnreadCount])

  const forceUpdateCount = useCallback(() => {
    setLastUpdate(Date.now())
  }, [])

  // Configurar WebSocket para recibir actualizaciones en tiempo real
  useEffect(() => {
    if (!user?.id) return

    // Para desarrollo local, usar WebSocket en localhost
    const wsUrl = 'http://localhost:8080/ws'

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        userId: user.id.toString()
      },
      onConnect: () => {
        console.log('=== WEB SOCKET CONECTADO ===')
        console.log('Usuario ID:', user.id)
        console.log('Destino de suscripción:', `/user/${user.id}/queue/notifications`)
        
        // Suscribirse a las notificaciones privadas del usuario
        client.subscribe(`/user/${user.id}/queue/notifications`, (message) => {
          console.log('=== MENSAJE WEB SOCKET RECIBIDO ===')
          console.log('Mensaje completo:', message)
          console.log('Body del mensaje:', message.body)
          console.log('Headers:', message.headers)
          
          try {
            const newCount = parseInt(message.body)
            console.log('Contador parseado:', newCount)
            console.log('Contador anterior:', unreadCount)
            
            // Marcar que estamos actualizando desde WebSocket
            isUpdatingFromWebSocket.current = true
            
            // Actualizar el estado inmediatamente
            setUnreadCount(newCount)
            console.log('✓ Contador actualizado exitosamente a:', newCount)
            
            // Actualizar timestamp de última actualización WebSocket
            lastWebSocketUpdate.current = Date.now()
            
            // Resetear la bandera después de un breve delay
            setTimeout(() => {
              isUpdatingFromWebSocket.current = false
            }, 100)
            
          } catch (error) {
            console.error('❌ Error al procesar mensaje WebSocket:', error)
            // Si hay error, refrescar desde la API
            isUpdatingFromWebSocket.current = false
            fetchUnreadCount()
          }
        })
        
        console.log('✓ Suscripción configurada exitosamente')
      },
      onDisconnect: () => {
        console.log('=== WEB SOCKET DESCONECTADO ===')
        console.log('Usuario ID:', user.id)
      },
      onStompError: (frame) => {
        console.error('=== ERROR STOMP ===')
        console.error('Frame completo:', frame)
        console.error('Comando:', frame.command)
        console.error('Headers:', frame.headers)
        console.error('Body:', frame.body)
      },
      onWebSocketError: (error) => {
        console.error('=== ERROR WEB SOCKET ===')
        console.error('Error completo:', error)
        console.error('Tipo de error:', error.type)
        console.error('Mensaje:', error.message)
      },
      onWebSocketClose: (event) => {
        console.log('=== WEB SOCKET CERRADO ===')
        console.log('Código:', event.code)
        console.log('Razón:', event.reason)
        console.log('Fue limpio:', event.wasClean)
      }
    })

    client.activate()
    setStompClient(client)

    // Cleanup al desmontar
    return () => {
      if (client.connected) {
        client.deactivate()
      }
    }
  }, [user?.id, fetchUnreadCount])

  // Cargar contador inicial cuando cambie el usuario
  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Actualizar contador cuando cambie lastUpdate (para sincronización manual)
  useEffect(() => {
    if (lastUpdate > 0 && !isUpdatingFromWebSocket.current) {
      fetchUnreadCount()
    }
  }, [lastUpdate, fetchUnreadCount])

  // Actualizar contador cada 30 segundos para mantener sincronización
  // Solo si no hemos recibido actualizaciones WebSocket recientes
  useEffect(() => {
    if (!user?.id) return
    
    const interval = setInterval(() => {
      const timeSinceLastWebSocket = Date.now() - lastWebSocketUpdate.current
      // Solo actualizar desde API si no hemos recibido WebSocket en los últimos 10 segundos
      if (timeSinceLastWebSocket > 10000) {
        fetchUnreadCount()
      }
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [user?.id, fetchUnreadCount])

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshUnreadCount, forceUpdateCount }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}
