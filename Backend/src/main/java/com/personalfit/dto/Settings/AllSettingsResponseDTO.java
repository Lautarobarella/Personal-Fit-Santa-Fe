package com.personalfit.dto.Settings;

public class AllSettingsResponseDTO {
    private Double monthlyFee;
    private Integer registrationTimeHours;
    private Integer unregistrationTimeHours;
    private Integer maxActivitiesPerDay;
    private Integer paymentGracePeriodDays;

    public AllSettingsResponseDTO() {
    }

    public AllSettingsResponseDTO(Double monthlyFee, Integer registrationTimeHours, Integer unregistrationTimeHours, Integer maxActivitiesPerDay, Integer paymentGracePeriodDays) {
        this.monthlyFee = monthlyFee;
        this.registrationTimeHours = registrationTimeHours;
        this.unregistrationTimeHours = unregistrationTimeHours;
        this.maxActivitiesPerDay = maxActivitiesPerDay;
        this.paymentGracePeriodDays = paymentGracePeriodDays;
    }

    public Double getMonthlyFee() {
        return monthlyFee;
    }

    public void setMonthlyFee(Double monthlyFee) {
        this.monthlyFee = monthlyFee;
    }

    public Integer getRegistrationTimeHours() {
        return registrationTimeHours;
    }

    public void setRegistrationTimeHours(Integer registrationTimeHours) {
        this.registrationTimeHours = registrationTimeHours;
    }

    public Integer getUnregistrationTimeHours() {
        return unregistrationTimeHours;
    }

    public void setUnregistrationTimeHours(Integer unregistrationTimeHours) {
        this.unregistrationTimeHours = unregistrationTimeHours;
    }

    public Integer getMaxActivitiesPerDay() {
        return maxActivitiesPerDay;
    }

    public void setMaxActivitiesPerDay(Integer maxActivitiesPerDay) {
        this.maxActivitiesPerDay = maxActivitiesPerDay;
    }

    public Integer getPaymentGracePeriodDays() {
        return paymentGracePeriodDays;
    }

    public void setPaymentGracePeriodDays(Integer paymentGracePeriodDays) {
        this.paymentGracePeriodDays = paymentGracePeriodDays;
    }
}
