package com.personalfit.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.dto.Settings.AllSettingsResponseDTO;
import com.personalfit.dto.Settings.MonthlyFeeRequestDTO;
import com.personalfit.dto.Settings.TimeRequestDTO;
import com.personalfit.services.SettingsService;

/**
 * Controller for Global Application Settings.
 * Handles configuration for monthly fees, registration windows, and limits.
 */
@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private SettingsService settingsService;

    /**
     * Get all current system settings.
     */
    @GetMapping("/all")
    public ResponseEntity<AllSettingsResponseDTO> getAllSettings() {
        AllSettingsResponseDTO allSettings = settingsService.getAllSettings();
        return ResponseEntity.ok(allSettings);
    }

    /**
     * Get current monthly fee amount.
     */
    @GetMapping("/monthly-fee")
    public ResponseEntity<Double> getMonthlyFee() {
        Double monthlyFee = settingsService.getMonthlyFee();
        return ResponseEntity.ok(monthlyFee);
    }

    /**
     * Update monthly fee amount.
     */
    @PostMapping("/monthly-fee")
    public ResponseEntity<Double> setMonthlyFee(@RequestBody MonthlyFeeRequestDTO request) {
        Double updatedFee = settingsService.setMonthlyFee(request.getAmount());
        return ResponseEntity.ok(updatedFee);
    }

    /**
     * Get how many hours before class a user can register.
     */
    @GetMapping("/registration-time")
    public ResponseEntity<Integer> getRegistrationTimeHours() {
        Integer hours = settingsService.getRegistrationTimeHours();
        return ResponseEntity.ok(hours);
    }

    /**
     * Update regulation time (hours before class) for registration.
     */
    @PostMapping("/registration-time")
    public ResponseEntity<Integer> setRegistrationTimeHours(@RequestBody TimeRequestDTO request) {
        Integer updatedHours = settingsService.setRegistrationTimeHours(request.getHours());
        return ResponseEntity.ok(updatedHours);
    }

    /**
     * Get how many hours before class a user can unregister.
     */
    @GetMapping("/unregistration-time")
    public ResponseEntity<Integer> getUnregistrationTimeHours() {
        Integer hours = settingsService.getUnregistrationTimeHours();
        return ResponseEntity.ok(hours);
    }

    /**
     * Update regulation time (hours before class) for unregistration.
     */
    @PostMapping("/unregistration-time")
    public ResponseEntity<Integer> setUnregistrationTimeHours(@RequestBody TimeRequestDTO request) {
        Integer updatedHours = settingsService.setUnregistrationTimeHours(request.getHours());
        return ResponseEntity.ok(updatedHours);
    }

    /**
     * Get max activities allowed per day per user.
     */
    @GetMapping("/max-activities-per-day")
    public ResponseEntity<Integer> getMaxActivitiesPerDay() {
        Integer maxActivities = settingsService.getMaxActivitiesPerDay();
        return ResponseEntity.ok(maxActivities);
    }

    /**
     * Update max activities allowed per day.
     */
    @PostMapping("/max-activities-per-day")
    public ResponseEntity<Integer> setMaxActivitiesPerDay(@RequestBody TimeRequestDTO request) {
        Integer updatedMaxActivities = settingsService.setMaxActivitiesPerDay(request.getHours());
        return ResponseEntity.ok(updatedMaxActivities);
    }

    /**
     * Get payment grace period (days).
     */
    @GetMapping("/payment-grace-period")
    public ResponseEntity<Integer> getPaymentGracePeriodDays() {
        Integer days = settingsService.getPaymentGracePeriodDays();
        return ResponseEntity.ok(days);
    }

    /**
     * Update payment grace period (days).
     */
    @PostMapping("/payment-grace-period")
    public ResponseEntity<Integer> setPaymentGracePeriodDays(@RequestBody TimeRequestDTO request) {
        // Reusing 'hours' field for days as per DTO structure
        Integer updatedDays = settingsService.setPaymentGracePeriodDays(request.getHours());
        return ResponseEntity.ok(updatedDays);
    }

}