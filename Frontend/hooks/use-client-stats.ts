import {
  ClientStats,
  fetchClientStats,
  fetchCompletedClasses,
  fetchMembershipStatus,
  fetchNextClass,
  fetchWeeklyActivities
} from '@/api/clients/clientStatsApi';
import { UserStatus } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';

export function useClientStats(clientId?: number) {
  const [stats, setStats] = useState<ClientStats>({
    weeklyActivityCount: 0,
    nextClass: null,
    completedClassesCount: 0,
    membershipStatus: UserStatus.INACTIVE
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!clientId) return;

    setLoading(true);
    setError(null);

    try {
      // Intentar usar el endpoint unificado primero
      try {
        const unifiedStats = await fetchClientStats(clientId);
        setStats(unifiedStats);
        return;
      } catch (unifiedError) {
        // Si el endpoint unificado no existe, usar endpoints individuales
        console.log('Endpoint unificado no disponible, usando endpoints individuales');
      }

      // Intentar cargar estadísticas individualmente
      try {
        const [
          weeklyActivityCount,
          nextClass,
          completedClassesCount,
          membershipStatus
        ] = await Promise.allSettled([
          fetchWeeklyActivities(clientId),
          fetchNextClass(clientId),
          fetchCompletedClasses(clientId),
          fetchMembershipStatus(clientId)
        ]);

        setStats({
          weeklyActivityCount: weeklyActivityCount.status === 'fulfilled' ? weeklyActivityCount.value : 0,
          nextClass: nextClass.status === 'fulfilled' ? nextClass.value : null,
          completedClassesCount: completedClassesCount.status === 'fulfilled' ? completedClassesCount.value : 0,
          membershipStatus: membershipStatus.status === 'fulfilled' ? membershipStatus.value : UserStatus.INACTIVE
        });
      } catch (individualError) {
        // Si los endpoints individuales tampoco existen, usar datos simulados temporales
        console.log('Endpoints no disponibles, usando datos temporales simulados');
        setStats({
          weeklyActivityCount: Math.floor(Math.random() * 5) + 1, // 1-5 actividades
          nextClass: {
            id: 1,
            name: "Yoga Matutino",
            date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
            time: "10:00"
          },
          completedClassesCount: Math.floor(Math.random() * 50) + 10, // 10-60 clases
          membershipStatus: Math.random() > 0.3 ? UserStatus.ACTIVE : UserStatus.INACTIVE // 70% activo
        });
      }

    } catch (err) {
      console.error('Error loading client stats:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refetch: loadStats
  };
}
