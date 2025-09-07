package com.personalfit.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.personalfit.dto.Settings.AllSettingsResponseDTO;
import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.models.Settings;
import com.personalfit.repository.SettingsRepository;

@Service
public class SettingsService {

    @Autowired
    private SettingsRepository settingsRepository;

    private static final String MONTHLY_FEE_KEY = "monthly_fee";
    private static final Double DEFAULT_MONTHLY_FEE = 25000.0;
    private static final String REGISTRATION_TIME_KEY = "registration_time_hours";
    private static final Integer DEFAULT_REGISTRATION_TIME = 24;
    private static final String UNREGISTRATION_TIME_KEY = "unregistration_time_hours";
    private static final Integer DEFAULT_UNREGISTRATION_TIME = 12;
    private static final String MAX_ACTIVITIES_PER_DAY_KEY = "max_activities_per_day";
    private static final Integer DEFAULT_MAX_ACTIVITIES_PER_DAY = 1;
    private static final String PAYMENT_GRACE_PERIOD_KEY = "payment_grace_period_days";
    private static final Integer DEFAULT_PAYMENT_GRACE_PERIOD = 10;

    /**
     * Obtiene todas las configuraciones en una sola llamada
     * 
     * @return AllSettingsResponseDTO - Todas las configuraciones
     */
    public AllSettingsResponseDTO getAllSettings() {
        Double monthlyFee = getMonthlyFee();
        Integer registrationTimeHours = getRegistrationTimeHours();
        Integer unregistrationTimeHours = getUnregistrationTimeHours();
        Integer maxActivitiesPerDay = getMaxActivitiesPerDay();
        Integer paymentGracePeriodDays = getPaymentGracePeriodDays();
        
        return new AllSettingsResponseDTO(monthlyFee, registrationTimeHours, unregistrationTimeHours, maxActivitiesPerDay, paymentGracePeriodDays);
    }

    public Double getMonthlyFee() {
        try {
            Settings setting = settingsRepository.findByKey(MONTHLY_FEE_KEY)
                    .orElseGet(() -> createDefaultMonthlyFeeSetting());
            return Double.parseDouble(setting.getValue());
        } catch (Exception e) {
            // En caso de error, retornar el valor por defecto
            return DEFAULT_MONTHLY_FEE;
        }
    }

    public Double setMonthlyFee(Double amount) {
        if (amount == null || amount <= 0) {
            throw new BusinessRuleException("Monthly fee must be a positive number", "Api/Settings/setMonthlyFee");
        }

        Settings setting = settingsRepository.findByKey(MONTHLY_FEE_KEY)
                .orElseGet(() -> new Settings(MONTHLY_FEE_KEY, amount.toString(), "Cuota mensual del gimnasio"));

        setting.setValue(amount.toString());
        settingsRepository.save(setting);

        return amount;
    }

    public Integer getRegistrationTimeHours() {
        Settings setting = settingsRepository.findByKey(REGISTRATION_TIME_KEY)
                .orElseGet(() -> createDefaultRegistrationTimeSetting());
        return setting != null ? Integer.parseInt(setting.getValue()) : DEFAULT_REGISTRATION_TIME; // Default 24 horas
    }

    public Integer setRegistrationTimeHours(Integer hours) {

        if (hours == null || hours <= 0) {
            throw new BusinessRuleException("Registration time must be a positive number", "Api/Settings/setRegistrationTimeHours");
        }

        Settings setting = settingsRepository.findByKey(REGISTRATION_TIME_KEY)
                .orElseGet(() -> createDefaultRegistrationTimeSetting());

        setting.setValue(hours.toString());

        settingsRepository.save(setting);
        return hours;
    }

    public Integer getUnregistrationTimeHours() {

        Settings setting = settingsRepository.findByKey(UNREGISTRATION_TIME_KEY)
                .orElseGet(() -> createDefaultUnregistrationTimeSetting());
        return setting != null ? Integer.parseInt(setting.getValue()) : DEFAULT_UNREGISTRATION_TIME; // Default 12 horas
    }

    public Integer setUnregistrationTimeHours(Integer hours) {

        if (hours == null || hours <= 0) {
            throw new BusinessRuleException("Unregistration time must be a positive number", "Api/Settings/setUnregistrationTimeHours");
        }
        
        Settings setting = settingsRepository.findByKey(UNREGISTRATION_TIME_KEY)
                .orElseGet(() -> createDefaultUnregistrationTimeSetting());

        setting.setValue(hours.toString());
        
        settingsRepository.save(setting);
        return hours;
    }

    public Integer getMaxActivitiesPerDay() {
        Settings setting = settingsRepository.findByKey(MAX_ACTIVITIES_PER_DAY_KEY)
                .orElseGet(() -> createDefaultMaxActivitiesPerDaySetting());
        return setting != null ? Integer.parseInt(setting.getValue()) : DEFAULT_MAX_ACTIVITIES_PER_DAY;
    }

    public Integer setMaxActivitiesPerDay(Integer maxActivities) {
        if (maxActivities == null || maxActivities <= 0) {
            throw new BusinessRuleException("Max activities per day must be a positive number", 
                    "Api/Settings/setMaxActivitiesPerDay");
        }
        
        Settings setting = settingsRepository.findByKey(MAX_ACTIVITIES_PER_DAY_KEY)
                .orElseGet(() -> createDefaultMaxActivitiesPerDaySetting());

        setting.setValue(maxActivities.toString());
        
        settingsRepository.save(setting);
        return maxActivities;
    }

    public Integer getPaymentGracePeriodDays() {
        try {
            Settings setting = settingsRepository.findByKey(PAYMENT_GRACE_PERIOD_KEY)
                    .orElseGet(() -> createDefaultPaymentGracePeriodSetting());
            return Integer.parseInt(setting.getValue());
        } catch (Exception e) {
            // En caso de error, retornar el valor por defecto
            return DEFAULT_PAYMENT_GRACE_PERIOD;
        }
    }

    public Integer setPaymentGracePeriodDays(Integer days) {
        if (days == null || days < 0) {
            throw new BusinessRuleException("Payment grace period must be a non-negative number", 
                    "Api/Settings/setPaymentGracePeriodDays");
        }
        
        Settings setting = settingsRepository.findByKey(PAYMENT_GRACE_PERIOD_KEY)
                .orElseGet(() -> createDefaultPaymentGracePeriodSetting());

        setting.setValue(days.toString());
        
        settingsRepository.save(setting);
        return days;
    }


    /**
     * Crea la configuración por defecto de la cuota mensual
     * 
     * @return Settings - Configuración creada
     */
    private Settings createDefaultMonthlyFeeSetting() {
        Settings setting = new Settings(
                MONTHLY_FEE_KEY,
                DEFAULT_MONTHLY_FEE.toString(),
                "Cuota mensual del gimnasio");
        return settingsRepository.save(setting);
    }

    /**
     * Crea la configuración por defecto del tiempo de inscripción
     * 
     * @return Settings - Configuración creada
     */
    private Settings createDefaultRegistrationTimeSetting() {
        Settings setting = new Settings(
                REGISTRATION_TIME_KEY,
                DEFAULT_REGISTRATION_TIME.toString(),
                "Tiempo mínimo de anticipación para inscribirse a una actividad (en horas)");
        return settingsRepository.save(setting);
    }

    /**
     * Crea la configuración por defecto del tiempo de desinscripción
     * 
     * @return Settings - Configuración creada
     */
    private Settings createDefaultUnregistrationTimeSetting() {
        Settings setting = new Settings(
                UNREGISTRATION_TIME_KEY,
                DEFAULT_UNREGISTRATION_TIME.toString(),
                "Tiempo mínimo de anticipación para desinscribirse de una actividad (en horas)");
        return settingsRepository.save(setting);
    }

    /**
     * Crea la configuración por defecto del máximo de actividades por día
     * 
     * @return Settings - Configuración creada
     */
    private Settings createDefaultMaxActivitiesPerDaySetting() {
        Settings setting = new Settings(
                MAX_ACTIVITIES_PER_DAY_KEY,
                DEFAULT_MAX_ACTIVITIES_PER_DAY.toString(),
                "Máximo número de actividades a las que un cliente puede inscribirse por día");
        return settingsRepository.save(setting);
    }

    /**
     * Crea la configuración por defecto del período de gracia de pago
     * 
     * @return Settings - Configuración creada
     */
    private Settings createDefaultPaymentGracePeriodSetting() {
        Settings setting = new Settings(
                PAYMENT_GRACE_PERIOD_KEY,
                DEFAULT_PAYMENT_GRACE_PERIOD.toString(),
                "Período de gracia en días para que usuarios con pago pendiente puedan inscribirse a actividades");
        return settingsRepository.save(setting);
    }
}