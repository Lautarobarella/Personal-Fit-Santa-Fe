import { useState, useEffect } from 'react';
import { 
  fetchRegistrationTime, 
  fetchUnregistrationTime, 
  updateRegistrationTime, 
  updateUnregistrationTime,
  fetchMonthlyFee,
  updateMonthlyFee,
  fetchAllSettings
} from '@/api/settings/settingsApi';
import { getSettingsFromLocalStorage } from '@/lib/auth';
import type { GlobalSettingsType } from '@/lib/types';

const MONTHLY_FEE_KEY = 'monthly_fee';
const REGISTRATION_TIME_KEY = 'registration_time_hours';
const UNREGISTRATION_TIME_KEY = 'unregistration_time_hours';

export function useSettings() {
  const [monthlyFee, setMonthlyFee] = useState<number>(0);
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
      const localSettings = getSettingsFromLocalStorage();
      
      if (localSettings) {
        setMonthlyFee(localSettings.monthlyFee);
        setRegistrationTime(localSettings.registrationTimeHours);
        setUnregistrationTime(localSettings.unregistrationTimeHours);
      }

      // Cargar desde backend y sincronizar (fallback y actualización)
      try {
        const allSettings = await fetchAllSettings();

        setMonthlyFee(allSettings.monthlyFee);
        setRegistrationTime(allSettings.registrationTimeHours);
        setUnregistrationTime(allSettings.unregistrationTimeHours);

        // Actualizar localStorage
        localStorage.setItem(MONTHLY_FEE_KEY, allSettings.monthlyFee.toString());
        localStorage.setItem(REGISTRATION_TIME_KEY, allSettings.registrationTimeHours.toString());
        localStorage.setItem(UNREGISTRATION_TIME_KEY, allSettings.unregistrationTimeHours.toString());
      } catch (backendError) {
        console.warn('Error loading settings from backend, using localStorage values:', backendError);
        // Si localStorage no tiene valores y backend falla, usar valores por defecto
        if (!localSettings) {
          setMonthlyFee(0);
          setRegistrationTime(24);
          setUnregistrationTime(3);
        }
      }

    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMonthlyFeeValue = async (amount: number) => {
    try {
      const updated = await updateMonthlyFee(amount);
      setMonthlyFee(updated);
      localStorage.setItem(MONTHLY_FEE_KEY, updated.toString());
      return updated;
    } catch (error) {
      console.error('Error updating monthly fee:', error);
      throw error;
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
    monthlyFee,
    registrationTime,
    unregistrationTime,
    loading,
    updateMonthlyFee: updateMonthlyFeeValue,
    updateRegistrationTime: updateRegTime,
    updateUnregistrationTime: updateUnregTime,
    reloadSettings: loadSettings
  };
}