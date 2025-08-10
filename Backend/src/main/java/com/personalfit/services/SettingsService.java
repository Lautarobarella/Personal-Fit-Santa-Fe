package com.personalfit.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.models.Settings;
import com.personalfit.repository.SettingsRepository;

@Service
public class SettingsService {

    @Autowired
    private SettingsRepository settingsRepository;

    private static final String MONTHLY_FEE_KEY = "monthly_fee";
    private static final Double DEFAULT_MONTHLY_FEE = 25000.0;

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
}