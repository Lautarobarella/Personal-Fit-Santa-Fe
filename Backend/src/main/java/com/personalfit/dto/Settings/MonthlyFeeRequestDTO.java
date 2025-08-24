package com.personalfit.dto.Settings;

public class MonthlyFeeRequestDTO {
    private Double amount;

    public MonthlyFeeRequestDTO(Double amount) {
        this.amount = amount;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }
}
