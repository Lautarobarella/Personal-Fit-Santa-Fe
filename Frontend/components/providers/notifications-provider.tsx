"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { getUnreadCount } from "@/api/notifications/notificationsApi"
import { Client } from '@stomp/stompjs'

interface NotificationsContextType {
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [stompClient, setStompClient] = useState<Client | null>(null)

  const fetchUnreadCount = async () => {
    if (user?.id) {
      try {
        const count = await getUnreadCount(user.id)
        setUnreadCount(count)
      } catch (error) {
        console.error('Error fetching unread count:', error)
        setUnreadCount(0)
      }
    }
  }

  const refreshUnreadCount = async () => {
    await fetchUnreadCount()
  }

  // Configurar WebSocket para recibir actualizaciones en tiempo real
  useEffect(() => {
    if (!user?.id) return

    // Determinar URL del WebSocket según el entorno
    const wsUrl = process.env.NODE_ENV === 'development' 
      ? 'ws://localhost:8080/ws'
      : 'ws://72.60.1.76:8080/ws'

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        userId: user.id.toString()
      },
      onConnect: () => {
        console.log('WebSocket conectado para notificaciones')
        
        // Suscribirse a las notificaciones privadas del usuario
        client.subscribe(`/user/${user.id}/queue/notifications`, (message) => {
          try {
            const newCount = parseInt(message.body)
            console.log('Nuevo contador recibido:', newCount)
            setUnreadCount(newCount)
          } catch (error) {
            console.error('Error al procesar mensaje WebSocket:', error)
          }
        })
      },
      onDisconnect: () => {
        console.log('WebSocket desconectado')
      },
      onStompError: (frame) => {
        console.error('Error STOMP:', frame)
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
  }, [user?.id])

  useEffect(() => {
    fetchUnreadCount()
  }, [user?.id])

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshUnreadCount }}>
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
