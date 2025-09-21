'use client';

import { NotificationSetup } from '@/components/notifications/notification-setup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotificationStatus } from '@/components/providers/pwa-notification-provider';
import { Bell, CheckCircle, XCircle, Clock } from 'lucide-react';

export function NotificationSettingsPage() {
  const { 
    isSupported, 
    canReceiveNotifications, 
    needsPermission, 
    isBlocked,
    needsToggle,
    pushNotificationsEnabled
  } = useNotificationStatus();

  const getStatusBadge = () => {
    if (!isSupported) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          No Soportado
        </Badge>
      );
    }
    
    if (canReceiveNotifications) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Activas
        </Badge>
      );
    }
    
    if (isBlocked) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Bloqueadas
        </Badge>
      );
    }
    
    if (needsPermission) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pendiente
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Bell className="h-3 w-3" />
        Desconocido
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Configuración de Notificaciones</h1>
          {getStatusBadge()}
        </div>
        <p className="text-muted-foreground">
          Configura cómo y cuándo quieres recibir notificaciones de Personal Fit.
        </p>
      </div>

      {/* Main Content */}
      <NotificationSetup />

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">¿Cómo funcionan las notificaciones?</CardTitle>
          <CardDescription>
            Información importante sobre las notificaciones push en Personal Fit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Recordatorios Inteligentes</h4>
                <p className="text-sm text-muted-foreground">
                  Recibe recordatorios 30 minutos antes de tus clases para que nunca te olvides.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Gestión de Pagos</h4>
                <p className="text-sm text-muted-foreground">
                  Mantente al día con notificaciones sobre pagos vencidos y recordatorios de cuotas.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Novedades del Gimnasio</h4>
                <p className="text-sm text-muted-foreground">
                  Entérate inmediatamente sobre nuevas clases, cambios de horario y promociones especiales.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Acciones Rápidas</h4>
                <p className="text-sm text-muted-foreground">
                  Confirma tu asistencia o paga cuotas directamente desde las notificaciones.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Privacidad y Seguridad</h4>
            <p className="text-sm text-muted-foreground">
              Tus tokens de notificación están encriptados y protegidos. Solo Personal Fit puede 
              enviarte notificaciones y puedes desactivarlas en cualquier momento. Nunca compartimos 
              tu información con terceros.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}