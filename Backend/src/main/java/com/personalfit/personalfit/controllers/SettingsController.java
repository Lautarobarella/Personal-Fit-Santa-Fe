package com.personalfit.personalfit.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.personalfit.services.ISettingsService;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private ISettingsService settingsService;

    @GetMapping("/monthly-fee")
    public ResponseEntity<Double> getMonthlyFee() {
        Double monthlyFee = settingsService.getMonthlyFee();
        return ResponseEntity.ok(monthlyFee);
    }

    @PostMapping("/monthly-fee")
    public ResponseEntity<Double> setMonthlyFee(@RequestBody MonthlyFeeRequest request) {
        Double updatedFee = settingsService.setMonthlyFee(request.getAmount());
        return ResponseEntity.ok(updatedFee);
    }

    public static class MonthlyFeeRequest {
        private Double amount;

        public Double getAmount() {
            return amount;
        }

        public void setAmount(Double amount) {
            this.amount = amount;
        }
    }
} 