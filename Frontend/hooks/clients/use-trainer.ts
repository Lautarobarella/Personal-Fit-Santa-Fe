import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
    MonthlyDayHours,
    TodayShiftInfo,
    TrainerDashboardStats,
    UserRole,
    WorkShift,
} from '@/lib/types';
import {
    fetchCurrentShift,
    fetchShiftHistory,
    fetchTrainerDashboardStats,
    toggleTrainerShift,
} from '@/api/clients/usersApi';

export function useTrainer() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [currentShift, setCurrentShift] = useState<WorkShift | null>(null);
    const [loading, setLoading] = useState(false);
    const [shiftHistory, setShiftHistory] = useState<WorkShift[]>([]);
    const [todayShift, setTodayShift] = useState<TodayShiftInfo>({
        checkInTime: null,
        checkOutTime: null,
        hasCheckedIn: false,
        hasCheckedOut: false,
    });
    const [dashboardStats, setDashboardStats] = useState<TrainerDashboardStats | null>(null);

    // Build today's check-in/out info from shift history + current shift
    const buildTodayShift = useCallback((history: WorkShift[], active: WorkShift | null) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find completed shifts from today
        const todayShifts = history.filter(s => {
            const start = new Date(s.startTime);
            return start >= today && start < tomorrow && (s.status === 'COMPLETED' || s.status === 'AUTO_CLOSED');
        });

        // Active shift starting today
        const activeIsToday = active && new Date(active.startTime) >= today && new Date(active.startTime) < tomorrow;

        let checkInTime: string | null = null;
        let checkOutTime: string | null = null;

        if (activeIsToday) {
            checkInTime = active!.startTime;
        } else if (todayShifts.length > 0) {
            const sorted = [...todayShifts].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
            checkInTime = sorted[0].startTime;
            const lastCompleted = sorted[sorted.length - 1];
            if (lastCompleted.endTime) {
                checkOutTime = lastCompleted.endTime;
            }
        }

        setTodayShift({
            checkInTime,
            checkOutTime,
            hasCheckedIn: !!checkInTime,
            hasCheckedOut: !!checkOutTime && !activeIsToday,
        });
    }, []);

    // Build monthly hours from shift history
    const getMonthlyHours = useCallback((): MonthlyDayHours[] => {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const dayMap = new Map<string, { totalHours: number; shifts: WorkShift[] }>();

        const lastDay = Math.min(now.getDate(), endOfMonth.getDate());
        for (let d = 1; d <= lastDay; d++) {
            const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            dayMap.set(dateStr, { totalHours: 0, shifts: [] });
        }

        shiftHistory.forEach(shift => {
            const startDate = new Date(shift.startTime);
            if (startDate >= firstOfMonth && startDate <= endOfMonth && shift.status !== 'ACTIVE') {
                const dateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
                const entry = dayMap.get(dateStr) || { totalHours: 0, shifts: [] };
                entry.totalHours += shift.totalHours || 0;
                entry.shifts.push(shift);
                dayMap.set(dateStr, entry);
            }
        });

        if (currentShift) {
            const startDate = new Date(currentShift.startTime);
            if (startDate >= firstOfMonth && startDate <= endOfMonth) {
                const dateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
                const entry = dayMap.get(dateStr) || { totalHours: 0, shifts: [] };
                const minutesSoFar = (Date.now() - startDate.getTime()) / (1000 * 60);
                entry.totalHours += minutesSoFar / 60;
                entry.shifts.push(currentShift);
                dayMap.set(dateStr, entry);
            }
        }

        return Array.from(dayMap.entries())
            .map(([date, data]) => ({ date, totalHours: data.totalHours, shifts: data.shifts }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [shiftHistory, currentShift]);

    const loadTrainerData = useCallback(async () => {
        if (!user || user.role !== UserRole.TRAINER) return;

        try {
            setLoading(true);

            const [activeShift, history, stats] = await Promise.all([
                fetchCurrentShift(user.id),
                fetchShiftHistory(user.id),
                fetchTrainerDashboardStats(user.id),
            ]);

            setCurrentShift(activeShift);
            setShiftHistory(history);
            if (stats) setDashboardStats(stats);

            buildTodayShift(history, activeShift);
        } catch (error) {
            console.error('Error fetching trainer data:', error);
        } finally {
            setLoading(false);
        }
    }, [user, buildTodayShift]);

    const toggleShift = async () => {
        if (!user || !user.dni) return;

        try {
            setLoading(true);
            const data = await toggleTrainerShift(user.dni);

            if (data.success) {
                toast({
                    title: data.status === 'CHECK_IN' ? 'Check-in registrado' : 'Check-out registrado',
                    description: data.message,
                    variant: 'default'
                });
                loadTrainerData();
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'No se pudo registrar',
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
        loadTrainerData();
    }, [loadTrainerData]);

    return {
        currentShift,
        dashboardStats,
        loading,
        todayShift,
        shiftHistory,
        getMonthlyHours,
        refreshShift: loadTrainerData,
        toggleShift
    };
}
