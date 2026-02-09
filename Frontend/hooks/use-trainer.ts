import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-provider';
import { UserRole } from '@/lib/types';
import { useToast } from './use-toast';

export interface WorkShift {
    id: number;
    startTime: string; // ISO string
    endTime: string | null;
    totalHours: number | null;
    status: 'ACTIVE' | 'COMPLETED' | 'AUTO_CLOSED';
}

export function useTrainer() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [currentShift, setCurrentShift] = useState<WorkShift | null>(null);
    const [loading, setLoading] = useState(false);
    const [dashboardStats, setDashboardStats] = useState<{
        classesToday: number;
        nextClassName: string | null;
        nextClassTime: string | null;
        currentShiftHours: number;
        weeklyHours: number;
    } | null>(null);

    const fetchCurrentShift = useCallback(async () => {
        // Only fetch if user is logged in and is a trainer
        if (!user || user.role !== UserRole.TRAINER) return;

        try {
            setLoading(true);
            const shiftResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/work-shifts/current/${user.id}`, {
                credentials: 'include'
            });

            if (shiftResponse.status === 204) {
                setCurrentShift(null);
            } else if (shiftResponse.ok) {
                const data = await shiftResponse.json();
                setCurrentShift(data);
            }

            // Fetch stats
            const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trainer/${user.id}/dashboard-stats`, {
                credentials: 'include'
            });

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setDashboardStats(statsData);
            }

        } catch (error) {
            console.error('Error fetching trainer data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Execute check-in/check-out via NFC endpoint (simulated for manual button)
    // In a real scenario, this would be triggered by the physical NFC reader, 
    // but for the dashboard button we can hit the same endpoint mock or a manual one if we had it.
    // Since the requirement says "reuse NFC endpoint", we will call that.
    const toggleShift = async () => {
        if (!user || !user.dni) return;

        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/nfc/9551674a19bae81d4d27f5436470c9ee6ecd0b371088686f6afc58d6bf68df30`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ dni: user.dni })
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: data.status === 'CHECK_IN' ? 'Turno iniciado' : 'Turno finalizado',
                    description: data.message,
                    variant: 'default'
                });
                // Refresh state
                fetchCurrentShift();
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'No se pudo registrar el turno',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Error toggling shift:', error);
            toast({
                title: 'Error de conexión',
                description: 'No se pudo conectar con el servidor',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentShift();
    }, [fetchCurrentShift]);

    return {
        currentShift,
        dashboardStats,
        loading,
        refreshShift: fetchCurrentShift,
        toggleShift
    };
}
