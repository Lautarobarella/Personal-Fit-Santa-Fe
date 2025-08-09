"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from './providers/auth-provider'
import { useNotifications as useNotificationsContext } from './providers/notifications-provider'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function WebSocketTestButton() {
  const { user } = useAuth()
  const { unreadCount, refreshUnreadCount } = useNotificationsContext()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')

  // Verificar estado del WebSocket
  useEffect(() => {
    const checkWebSocketStatus = () => {
      // Verificar si hay conexión WebSocket activa
      const ws = new WebSocket('ws://localhost:8080/ws')
      
      ws.onopen = () => {
        setWsStatus('connected')
        ws.close()
      }
      
      ws.onerror = () => {
        setWsStatus('error')
      }
      
      ws.onclose = () => {
        if (wsStatus === 'connected') {
          setWsStatus('disconnected')
        }
      }
    }

    if (user?.id) {
      checkWebSocketStatus()
      const interval = setInterval(checkWebSocketStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [user?.id, wsStatus])

  const sendTestNotification = async () => {
    if (!user?.id) {
      setResult('No hay usuario autenticado')
      return
    }

    setIsLoading(true)
    setResult('')

    try {
      const response = await fetch(`http://localhost:8080/api/websocket-test/send-notification/${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: Math.floor(Math.random() * 100) + 1 }),
      })

      const data = await response.text()
      
      if (response.ok) {
        setResult(`✓ ${data}`)
        // Refrescar contador después de enviar notificación
        setTimeout(() => {
          refreshUnreadCount()
        }, 500)
      } else {
        setResult(`✗ ${data}`)
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkWebSocketStatus = async () => {
    setIsLoading(true)
    setResult('')

    try {
      const response = await fetch('http://localhost:8080/api/websocket-test/status')
      const data = await response.json()
      
      if (response.ok) {
        setResult(`✓ Estado obtenido: ${data.message}`)
      } else {
        setResult(`✗ Error: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const forceRefreshCount = async () => {
    setIsLoading(true)
    setResult('')
    
    try {
      await refreshUnreadCount()
      setResult('✓ Contador refrescado manualmente')
    } catch (error) {
      setResult(`❌ Error al refrescar: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800'
      case 'connecting': return 'bg-yellow-100 text-yellow-800'
      case 'disconnected': return 'bg-gray-100 text-gray-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado'
      case 'connecting': return 'Conectando...'
      case 'disconnected': return 'Desconectado'
      case 'error': return 'Error'
      default: return 'Desconocido'
    }
  }

  return (
    <Card className="p-4 border rounded-lg bg-gray-50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Prueba de WebSocket</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado del WebSocket */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Estado WebSocket:</span>
          <Badge className={getStatusColor(wsStatus)}>
            {getStatusText(wsStatus)}
          </Badge>
        </div>

        {/* Contador de notificaciones */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Notificaciones no leídas:</span>
          <Badge variant="destructive" className="text-sm">
            {unreadCount}
          </Badge>
        </div>

        {/* Información del usuario */}
        <div className="text-sm text-gray-600">
          Usuario ID: {user.id}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={sendTestNotification} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? 'Enviando...' : 'Enviar Notificación'}
          </Button>
          
          <Button 
            onClick={checkWebSocketStatus} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? 'Verificando...' : 'Verificar Estado'}
          </Button>
          
          <Button 
            onClick={forceRefreshCount} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? 'Refrescando...' : 'Refrescar Contador'}
          </Button>
        </div>

        {/* Resultado */}
        {result && (
          <div className={`mt-2 p-2 rounded text-sm ${
            result.startsWith('✓') ? 'bg-green-100 text-green-800' :
            result.startsWith('✗') ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {result}
          </div>
        )}

        {/* Información adicional */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• El WebSocket debe estar conectado para recibir actualizaciones en tiempo real</p>
          <p>• Las notificaciones se envían al backend y se actualizan por WebSocket</p>
          <p>• Si el contador no se actualiza, verifica la consola del navegador</p>
        </div>
      </CardContent>
    </Card>
  )
}
