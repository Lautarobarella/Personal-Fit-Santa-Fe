"use client"

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/auth-provider";
import { requestNotificationPermission } from "@/lib/firebase-messaging";
import { registerDeviceToken } from "@/api/notifications/notificationsApi";
import { RegisterDeviceRequest, UserRole } from "@/lib/types";

interface NotificationPermissionRequestProps {
    onDismiss?: () => void;
}

export function NotificationPermissionRequest({ onDismiss }: NotificationPermissionRequestProps) {
    const { user } = useAuth();
    const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'requesting'>('unknown');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showRequest, setShowRequest] = useState(false);

    useEffect(() => {
        checkPermissionStatus();
    }, []);

    useEffect(() => {
            checkShouldShowRequest();
    }, [user]);

    const checkPermissionStatus = () => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            setPermissionState('denied');
            return;
        }

        const permission = Notification.permission;
        if (permission === 'granted') {
            setPermissionState('granted');
        } else if (permission === 'denied') {
            setPermissionState('denied');
        } else {
            setPermissionState('unknown'); // 'default' state
        }
    };

    const checkShouldShowRequest = () => {
        // Verificar si el usuario ya respondió a la solicitud
        const hasResponded = localStorage.getItem('notification-permission-responded');
        const permission = Notification.permission;
        
        // Mostrar solo si no ha respondido y el permiso no está otorgado
        if (!hasResponded && permission !== 'granted') {
            setShowRequest(true);
        }
    };

    const handleRequestPermission = async () => {
        setPermissionState('requesting');
        setError(null);

        try {
            const token = await requestNotificationPermission();
            
            if (token) {
                setPermissionState('granted');
                await registerDevice(token);
                localStorage.setItem('notification-permission-responded', 'true');
                localStorage.setItem('notification-permission-granted', 'true');
                setShowRequest(false);
            } else {
                setPermissionState('denied');
                localStorage.setItem('notification-permission-responded', 'true');
                setError('No se pudo obtener el token de notificación');
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            setPermissionState('denied');
            setError('Error al solicitar permisos de notificación');
            localStorage.setItem('notification-permission-responded', 'true');
        }
    };

    const registerDevice = async (token: string) => {
        if (!user?.id) return;

        setIsRegistering(true);
        try {
            const deviceRequest: RegisterDeviceRequest = {
                token: token,
                deviceType: 'PWA',
                userId: user.id
            };

            const success = await registerDeviceToken(deviceRequest);
            if (!success) {
                setError('Error al registrar el dispositivo para notificaciones');
            }
        } catch (error) {
            console.error('Error registering device:', error);
            setError('Error al registrar el dispositivo');
        } finally {
            setIsRegistering(false);
        }
    };

    const handleCancel = () => {
        localStorage.setItem('notification-permission-responded', 'true');
        setShowRequest(false);
        onDismiss?.();
    };

    // No mostrar el componente si:
    // - No es un cliente
    // - Ya tiene permisos otorgados
    if (user?.role !== UserRole.CLIENT || permissionState === 'granted') {
        return null;
    }

    return (
        <AlertDialog open={showRequest} onOpenChange={() => {}}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center space-x-2 mb-2">
                        <Bell className="h-5 w-5 text-blue-600" />
                        <AlertDialogTitle className="text-lg">Recibe Notificaciones</AlertDialogTitle>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            Recomendado
                        </Badge>
                    </div>
                    <AlertDialogDescription className="text-left">
                        Activa las notificaciones para recibir recordatorios de clases, pagos y noticias importantes del gimnasio.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {error && (
                    <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-3">
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p className="flex items-center">
                            <span className="mr-2">🔔</span>
                            Recordatorios de clases programadas
                        </p>
                        <p className="flex items-center">
                            <span className="mr-2">💳</span>
                            Notificaciones de vencimiento de pagos
                        </p>
                        <p className="flex items-center">
                            <span className="mr-2">📢</span>
                            Noticias importantes del gimnasio
                        </p>
                    </div>
                </div>

                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel onClick={handleCancel} className="mt-0">
                        Ahora no
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleRequestPermission}
                        disabled={permissionState === 'requesting' || isRegistering}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {permissionState === 'requesting' || isRegistering ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                {isRegistering ? 'Registrando...' : 'Solicitando...'}
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Activar Notificaciones
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}