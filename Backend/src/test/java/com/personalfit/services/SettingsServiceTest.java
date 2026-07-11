package com.personalfit.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.models.Settings;
import com.personalfit.repository.SettingsRepository;

@ExtendWith(MockitoExtension.class)
class SettingsServiceTest {

    private static final String MONTHLY_FEE_KEY = "monthly_fee";

    @Mock
    private SettingsRepository settingsRepository;

    @InjectMocks
    private SettingsService settingsService;

    private void mockMonthlyFeeValue(String value) {
        when(settingsRepository.findByKey(MONTHLY_FEE_KEY))
                .thenReturn(Optional.of(new Settings(MONTHLY_FEE_KEY, value, "Monthly gym fee")));
    }

    @Test
    void getMonthlyFeeStrict_withValidValue_returnsConfiguredFee() {
        mockMonthlyFeeValue("30000.0");

        assertEquals(30000.0, settingsService.getMonthlyFeeStrict());
    }

    @Test
    void getMonthlyFeeStrict_withMissingKey_createsAndReturnsDefault() {
        when(settingsRepository.findByKey(MONTHLY_FEE_KEY)).thenReturn(Optional.empty());
        when(settingsRepository.save(any(Settings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertEquals(25000.0, settingsService.getMonthlyFeeStrict());
    }

    @Test
    void getMonthlyFeeStrict_withUnparseableValue_throwsBusinessRuleException() {
        mockMonthlyFeeValue("no-es-un-numero");

        assertThrows(BusinessRuleException.class, () -> settingsService.getMonthlyFeeStrict());
    }

    @Test
    void getMonthlyFeeStrict_withNaNValue_throwsBusinessRuleException() {
        mockMonthlyFeeValue("NaN");

        assertThrows(BusinessRuleException.class, () -> settingsService.getMonthlyFeeStrict());
    }

    @Test
    void getMonthlyFeeStrict_withInfiniteValue_throwsBusinessRuleException() {
        mockMonthlyFeeValue("Infinity");

        assertThrows(BusinessRuleException.class, () -> settingsService.getMonthlyFeeStrict());
    }

    @Test
    void getMonthlyFeeStrict_withNonPositiveValue_throwsBusinessRuleException() {
        mockMonthlyFeeValue("0");

        assertThrows(BusinessRuleException.class, () -> settingsService.getMonthlyFeeStrict());
    }

    @Test
    void setMonthlyFee_withNaN_throwsBusinessRuleException() {
        assertThrows(BusinessRuleException.class, () -> settingsService.setMonthlyFee(Double.NaN));
    }
}
