'use client';

import { usePWANotifications } from '@/hooks/notifications/use-pwa-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  BellOff, 
  Smartphone, 
  Clock, 
  CreditCard, 
  Calendar, 
  Tag, 
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';

export function NotificationSetup() {
  const { 
    isSupported, 
    permission, 
    isGranted, 
    isActive, 
    isLoading, 
    preferences,
    pushNotificationsEnabled,
    hasDeviceTokens,
    requestPermission, 
    togglePushNotifications,
    updatePreferences
  } = usePWANotifications();

  const handlePreferenceChange = async (key: string, value: boolean) => {
    if (!preferences) return;
    
    const newPreferences = {
      ...preferences,
      [key]: value
    };
    
    await updatePreferences(newPreferences);
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            Notificaciones no disponibles
          </CardTitle>
          <CardDescription>
            Tu navegador no soporta notificaciones push o necesitas instalar la PWA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Para recibir notificaciones, asegúrate de:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Usar un navegador compatible (Chrome, Firefox, Safari)</li>
                <li>Instalar Personal Fit como PWA</li>
                <li>Permitir notificaciones en la configuración del navegador</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getStatusInfo = () => {
    if (hasDeviceTokens && pushNotificationsEnabled) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        text: "Activas",
        variant: "default" as const
      };
    } else if (permission === 'denied') {
      return {
        icon: <XCircle className="h-4 w-4 text-red-600" />,
        text: "Bloqueadas",
        variant: "destructive" as const
      };
    } else if (hasDeviceTokens && !pushNotificationsEnabled) {
      return {
        icon: <BellOff className="h-4 w-4 text-orange-600" />,
        text: "Desactivadas",
        variant: "secondary" as const
      };
    } else {
      return {
        icon: <Bell className="h-4 w-4 text-orange-600" />,
        text: "No configuradas",
        variant: "secondary" as const
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones Push
          </CardTitle>
          <CardDescription>
            Recibe recordatorios de clases, pagos y actualizaciones importantes directamente en tu dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Estado actual:</span>
              <div className="flex items-center gap-1">
                {statusInfo.icon}
                <span className="text-sm">{statusInfo.text}</span>
              </div>
            </div>
            
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {!hasDeviceTokens && permission !== 'denied' && (
            <Button 
              onClick={requestPermission} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Solicitar Permisos de Notificación
            </Button>
          )}

          {hasDeviceTokens && (
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications" className="text-sm font-medium">
                  Notificaciones Push
                </Label>
                <p className="text-xs text-muted-foreground">
                  {pushNotificationsEnabled ? 'Activas' : 'Desactivadas'}
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={pushNotificationsEnabled}
                onCheckedChange={(checked) => togglePushNotifications(checked)}
                disabled={isLoading}
              />
            </div>
          )}

          {permission === 'denied' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Las notificaciones están bloqueadas. Para activarlas:
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Ve a la configuración de tu navegador</li>
                  <li>Busca la sección de "Notificaciones" o "Permisos"</li>
                  <li>Permite las notificaciones para este sitio</li>
                  <li>Recarga la página</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Preferences Card */}
      {hasDeviceTokens && pushNotificationsEnabled && preferences && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Preferencias de Notificaciones
            </CardTitle>
            <CardDescription>
              Personaliza qué tipo de notificaciones quieres recibir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Class Reminders */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <Label htmlFor="class-reminders" className="text-sm font-medium">
                    Recordatorios de Clases
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notificaciones 30 minutos antes de tus clases
                  </p>
                </div>
              </div>
              <Switch
                id="class-reminders"
                checked={preferences.classReminders}
                onCheckedChange={(checked) => handlePreferenceChange('classReminders', checked)}
                disabled={isLoading}
              />
            </div>

            <Separator />

            {/* Payment Due */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-green-600" />
                <div>
                  <Label htmlFor="payment-due" className="text-sm font-medium">
                    Pagos Vencidos
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Recordatorios de pagos pendientes
                  </p>
                </div>
              </div>
              <Switch
                id="payment-due"
                checked={preferences.paymentDue}
                onCheckedChange={(checked) => handlePreferenceChange('paymentDue', checked)}
                disabled={isLoading}
              />
            </div>

            <Separator />

            {/* New Classes */}
{/*             <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-purple-600" />
                <div>
                  <Label htmlFor="new-classes" className="text-sm font-medium">
                    Nuevas Clases
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notificaciones cuando se agregan nuevas clases
                  </p>
                </div>
              </div>
              <Switch
                id="new-classes"
                checked={preferences.newClasses}
                onCheckedChange={(checked) => handlePreferenceChange('newClasses', checked)}
                disabled={isLoading}
              />
            </div> */}

            <Separator />

            {/* Promotions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-orange-600" />
                <div>
                  <Label htmlFor="promotions" className="text-sm font-medium">
                    Promociones y Ofertas
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Descuentos especiales y ofertas limitadas
                  </p>
                </div>
              </div>
              <Switch
                id="promotions"
                checked={preferences.promotions}
                onCheckedChange={(checked) => handlePreferenceChange('promotions', checked)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Información</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            • Las notificaciones funcionan incluso cuando la app está cerrada
          </p>
          <p>
            • Puedes responder a algunas notificaciones directamente desde el centro de notificaciones
          </p>
          <p>
            • Las preferencias se sincronizan automáticamente con nuestros servidores
          </p>
          <p>
            • Tus datos de notificación están protegidos y nunca se comparten con terceros
          </p>
        </CardContent>
      </Card>
    </div>
  );
}