"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cleanupServiceWorkers } from '@/lib/firebase-messaging'
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react'

export function NotificationDebug() {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const checkServiceWorkers = async () => {
    setIsLoading(true)
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        addLog(`Found ${registrations.length} service worker(s)`)
        
        registrations.forEach((registration, index) => {
          const scriptURL = registration.active?.scriptURL || 
                           registration.installing?.scriptURL || 
                           registration.waiting?.scriptURL || 'Unknown'
          const state = registration.active?.state || 
                       registration.installing?.state || 
                       registration.waiting?.state || 'Unknown'
          
          addLog(`SW ${index + 1}: ${scriptURL} (${state})`)
        })
        
        if (registrations.length === 0) {
          addLog('✅ No service workers registered')
        } else if (registrations.length > 1) {
          addLog('⚠️ Multiple service workers detected - this may cause conflicts')
        }
      } else {
        addLog('❌ Service Workers not supported')
      }
    } catch (error) {
      addLog(`❌ Error checking service workers: ${error}`)
    }
    setIsLoading(false)
  }

  const cleanupSW = async () => {
    setIsLoading(true)
    try {
      addLog('🧹 Starting cleanup...')
      await cleanupServiceWorkers()
      addLog('✅ Cleanup completed')
      addLog('💡 Please refresh the page')
    } catch (error) {
      addLog(`❌ Cleanup error: ${error}`)
    }
    setIsLoading(false)
  }

  const checkFirebaseConfig = () => {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    }

    addLog('🔧 Firebase Configuration Check:')
    Object.entries(config).forEach(([key, value]) => {
      if (value) {
        const maskedValue = key === 'apiKey' || key === 'appId' || key === 'vapidKey' 
          ? value.substring(0, 10) + '...' 
          : value
        addLog(`  ✅ ${key}: ${maskedValue}`)
      } else {
        addLog(`  ❌ ${key}: MISSING`)
      }
    })
  }

  const checkNotificationSupport = () => {
    addLog('🔍 Browser Support Check:')
    addLog(`  Notifications: ${'Notification' in window ? '✅' : '❌'}`)
    addLog(`  Service Workers: ${'serviceWorker' in navigator ? '✅' : '❌'}`)
    addLog(`  Push Manager: ${'PushManager' in window ? '✅' : '❌'}`)
    
    if ('Notification' in window) {
      addLog(`  Permission: ${Notification.permission}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Firebase Notifications Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={checkServiceWorkers} 
            disabled={isLoading}
            variant="outline"
          >
            <Info className="h-4 w-4 mr-2" />
            Check Service Workers
          </Button>
          
          <Button 
            onClick={cleanupSW} 
            disabled={isLoading}
            variant="destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup Service Workers
          </Button>
          
          <Button 
            onClick={checkFirebaseConfig} 
            disabled={isLoading}
            variant="outline"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Check Firebase Config
          </Button>
          
          <Button 
            onClick={checkNotificationSupport} 
            disabled={isLoading}
            variant="outline"
          >
            <Info className="h-4 w-4 mr-2" />
            Check Browser Support
          </Button>
          
          <Button 
            onClick={clearLogs} 
            variant="ghost"
          >
            Clear Logs
          </Button>
          
          <Button 
            onClick={() => window.location.reload()} 
            variant="ghost"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <Badge variant={isLoading ? "default" : "secondary"}>
            {isLoading ? 'Running...' : 'Ready'}
          </Badge>
        </div>

        {/* Logs Display */}
        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900 max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Debug Logs:</h3>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No logs yet. Click a button above to start debugging.
            </p>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className="text-xs font-mono p-1 rounded bg-white dark:bg-slate-800"
                >
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-2">
          <h4 className="font-semibold">Troubleshooting Steps:</h4>
          <ol className="list-decimal list-inside space-y-1">
            <li>Check Service Workers - should show only 1 Firebase SW</li>
            <li>If multiple SWs exist, run Cleanup Service Workers</li>
            <li>Check Firebase Config - all values should be present</li>
            <li>Check Browser Support - all should be ✅</li>
            <li>Refresh the page after cleanup</li>
            <li>Try requesting notifications again</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}