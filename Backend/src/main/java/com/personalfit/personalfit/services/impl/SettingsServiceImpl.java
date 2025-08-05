package com.personalfit.personalfit.services.impl;

import org.springframework.stereotype.Service;

import com.personalfit.personalfit.services.ISettingsService;

@Service
public class SettingsServiceImpl implements ISettingsService {
    
    // For now, we'll use a simple in-memory storage
    // In a production environment, this should be stored in a database
    private static Double monthlyFee = 25000.0; // Default value

    @Override
    public Double getMonthlyFee() {
        return monthlyFee;
    }

    @Override
    public Double setMonthlyFee(Double amount) {
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Monthly fee must be a positive number");
        }
        monthlyFee = amount;
        return monthlyFee;
    }
} 