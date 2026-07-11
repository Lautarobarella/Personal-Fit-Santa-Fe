package com.personalfit.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.personalfit.dto.Settings.AllSettingsResponseDTO;
import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.models.Settings;
import com.personalfit.repository.SettingsRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * Service for managing application-wide settings.
 * Handles retrieval and updates for configurations like monthly fees, timing
 * rules, and limits.
 */
@Service
@Slf4j
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
     * Retrieves all settings in a single call.
     * 
     * @return AllSettingsResponseDTO containing all configuration values.
     */
    public AllSettingsResponseDTO getAllSettings() {
        Double monthlyFee = getMonthlyFee();
        Integer registrationTimeHours = getRegistrationTimeHours();
        Integer unregistrationTimeHours = getUnregistrationTimeHours();
        Integer maxActivitiesPerDay = getMaxActivitiesPerDay();
        Integer paymentGracePeriodDays = getPaymentGracePeriodDays();

        return new AllSettingsResponseDTO(monthlyFee, registrationTimeHours, unregistrationTimeHours,
                maxActivitiesPerDay, paymentGracePeriodDays);
    }

    public Double getMonthlyFee() {
        try {
            Settings setting = settingsRepository.findByKey(MONTHLY_FEE_KEY)
                    .orElseGet(() -> createDefaultMonthlyFeeSetting());
            return Double.parseDouble(setting.getValue());
        } catch (Exception e) {
            log.warn("Failed to read monthly_fee setting, returning default: cause={}", e.getMessage());
            return DEFAULT_MONTHLY_FEE;
        }
    }

    /**
     * Strict variant for financial writes (payment creation): still creates the
     * default setting when the key is missing, but propagates read/parse
     * failures instead of silently falling back to the default amount, so no
     * payment is persisted with a fee different from the configured one.
     */
    public Double getMonthlyFeeStrict() {
        Settings setting = settingsRepository.findByKey(MONTHLY_FEE_KEY)
                .orElseGet(this::createDefaultMonthlyFeeSetting);
        Double fee;
        try {
            fee = Double.parseDouble(setting.getValue());
        } catch (NumberFormatException e) {
            throw new BusinessRuleException("La cuota mensual configurada es inválida.",
                    "Api/Settings/getMonthlyFee");
        }
        // parseDouble acepta "NaN" e "Infinity": un pago nunca puede
        // persistirse con un monto no finito o no positivo.
        if (!Double.isFinite(fee) || fee <= 0) {
            throw new BusinessRuleException("La cuota mensual configurada es inválida.",
                    "Api/Settings/getMonthlyFee");
        }
        return fee;
    }

    public Double setMonthlyFee(Double amount) {
        // isFinite también excluye NaN, para el cual `amount <= 0` es falso
        if (amount == null || !Double.isFinite(amount) || amount <= 0) {
            throw new BusinessRuleException("Monthly fee must be a positive number", "Api/Settings/setMonthlyFee");
        }

        Settings setting = settingsRepository.findByKey(MONTHLY_FEE_KEY)
                .orElseGet(() -> new Settings(MONTHLY_FEE_KEY, amount.toString(), "Monthly gym fee"));

        setting.setValue(amount.toString());
        settingsRepository.save(setting);

        log.info("Setting updated: key={}, value={}", MONTHLY_FEE_KEY, amount);
        return amount;
    }

    public Integer getRegistrationTimeHours() {
        Settings setting = settingsRepository.findByKey(REGISTRATION_TIME_KEY)
                .orElseGet(() -> createDefaultRegistrationTimeSetting());
        return setting != null ? Integer.parseInt(setting.getValue()) : DEFAULT_REGISTRATION_TIME; // Default 24 hours
    }

    public Integer setRegistrationTimeHours(Integer hours) {
        if (hours == null || hours < 0) {
            throw new BusinessRuleException("Registration time must be a non-negative number",
                    "Api/Settings/setRegistrationTimeHours");
        }

        Settings setting = settingsRepository.findByKey(REGISTRATION_TIME_KEY)
                .orElseGet(() -> createDefaultRegistrationTimeSetting());

        setting.setValue(hours.toString());

        settingsRepository.save(setting);
        log.info("Setting updated: key={}, value={}", REGISTRATION_TIME_KEY, hours);
        return hours;
    }

    public Integer getUnregistrationTimeHours() {

        Settings setting = settingsRepository.findByKey(UNREGISTRATION_TIME_KEY)
                .orElseGet(() -> createDefaultUnregistrationTimeSetting());
        return setting != null ? Integer.parseInt(setting.getValue()) : DEFAULT_UNREGISTRATION_TIME; // Default 12 hours
    }

    public Integer setUnregistrationTimeHours(Integer hours) {
        if (hours == null || hours < 0) {
            throw new BusinessRuleException("Unregistration time must be a non-negative number",
                    "Api/Settings/setUnregistrationTimeHours");
        }

        Settings setting = settingsRepository.findByKey(UNREGISTRATION_TIME_KEY)
                .orElseGet(() -> createDefaultUnregistrationTimeSetting());

        setting.setValue(hours.toString());

        settingsRepository.save(setting);
        log.info("Setting updated: key={}, value={}", UNREGISTRATION_TIME_KEY, hours);
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
        log.info("Setting updated: key={}, value={}", MAX_ACTIVITIES_PER_DAY_KEY, maxActivities);
        return maxActivities;
    }

    public Integer getPaymentGracePeriodDays() {
        try {
            Settings setting = settingsRepository.findByKey(PAYMENT_GRACE_PERIOD_KEY)
                    .orElseGet(() -> createDefaultPaymentGracePeriodSetting());
            return Integer.parseInt(setting.getValue());
        } catch (Exception e) {
            log.warn("Failed to read payment_grace_period setting, returning default: cause={}", e.getMessage());
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
        log.info("Setting updated: key={}, value={}", PAYMENT_GRACE_PERIOD_KEY, days);
        return days;
    }

    /**
     * Creates the default monthly fee setting.
     * 
     * @return Settings - Created configuration.
     */
    private Settings createDefaultMonthlyFeeSetting() {
        Settings setting = new Settings(
                MONTHLY_FEE_KEY,
                DEFAULT_MONTHLY_FEE.toString(),
                "Monthly gym fee");
        return settingsRepository.save(setting);
    }

    /**
     * Creates the default registration time setting.
     * 
     * @return Settings - Created configuration.
     */
    private Settings createDefaultRegistrationTimeSetting() {
        Settings setting = new Settings(
                REGISTRATION_TIME_KEY,
                DEFAULT_REGISTRATION_TIME.toString(),
                "Minimum lead time for activity enrollment (in hours)");
        return settingsRepository.save(setting);
    }

    /**
     * Creates the default unregistration time setting.
     * 
     * @return Settings - Created configuration.
     */
    private Settings createDefaultUnregistrationTimeSetting() {
        Settings setting = new Settings(
                UNREGISTRATION_TIME_KEY,
                DEFAULT_UNREGISTRATION_TIME.toString(),
                "Minimum lead time for unenrollment from activity (in hours)");
        return settingsRepository.save(setting);
    }

    /**
     * Creates the default max activities per day setting.
     * 
     * @return Settings - Created configuration.
     */
    private Settings createDefaultMaxActivitiesPerDaySetting() {
        Settings setting = new Settings(
                MAX_ACTIVITIES_PER_DAY_KEY,
                DEFAULT_MAX_ACTIVITIES_PER_DAY.toString(),
                "Maximum number of daily activities per client");
        return settingsRepository.save(setting);
    }

    /**
     * Creates the default payment grace period setting.
     * 
     * @return Settings - Created configuration.
     */
    private Settings createDefaultPaymentGracePeriodSetting() {
        Settings setting = new Settings(
                PAYMENT_GRACE_PERIOD_KEY,
                DEFAULT_PAYMENT_GRACE_PERIOD.toString(),
                "Grace period (in days) for users with pending payments to enroll in activities");
        return settingsRepository.save(setting);
    }
}
