import { useState, useEffect } from 'react';
import { 
  fetchRegistrationTime, 
  fetchUnregistrationTime, 
  updateRegistrationTime, 
  updateUnregistrationTime 
} from '@/api/settings/settingsApi';

const REGISTRATION_TIME_KEY = 'registration_time_hours';
const UNREGISTRATION_TIME_KEY = 'unregistration_time_hours';

export function useSettings() {
  const [registrationTime, setRegistrationTime] = useState<number>(24);
  const [unregistrationTime, setUnregistrationTime] = useState<number>(3);
  const [loading, setLoading] = useState(true);

  // Cargar configuraciones al iniciar
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Intentar cargar desde localStorage primero
      const localRegTime = localStorage.getItem(REGISTRATION_TIME_KEY);
      const localUnregTime = localStorage.getItem(UNREGISTRATION_TIME_KEY);

      if (localRegTime && localUnregTime) {
        setRegistrationTime(parseInt(localRegTime));
        setUnregistrationTime(parseInt(localUnregTime));
      }

      // Cargar desde backend y sincronizar
      const [regTime, unregTime] = await Promise.all([
        fetchRegistrationTime(),
        fetchUnregistrationTime()
      ]);

      setRegistrationTime(regTime);
      setUnregistrationTime(unregTime);

      // Actualizar localStorage
      localStorage.setItem(REGISTRATION_TIME_KEY, regTime.toString());
      localStorage.setItem(UNREGISTRATION_TIME_KEY, unregTime.toString());

    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRegTime = async (hours: number) => {
    try {
      const updated = await updateRegistrationTime(hours);
      setRegistrationTime(updated);
      localStorage.setItem(REGISTRATION_TIME_KEY, updated.toString());
      return updated;
    } catch (error) {
      console.error('Error updating registration time:', error);
      throw error;
    }
  };

  const updateUnregTime = async (hours: number) => {
    try {
      const updated = await updateUnregistrationTime(hours);
      setUnregistrationTime(updated);
      localStorage.setItem(UNREGISTRATION_TIME_KEY, updated.toString());
      return updated;
    } catch (error) {
      console.error('Error updating unregistration time:', error);
      throw error;
    }
  };

  return {
    registrationTime,
    unregistrationTime,
    loading,
    updateRegistrationTime: updateRegTime,
    updateUnregistrationTime: updateUnregTime,
    reloadSettings: loadSettings
  };
}