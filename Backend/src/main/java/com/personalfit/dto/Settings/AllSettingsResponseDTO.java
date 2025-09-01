package com.personalfit.dto.Settings;

public class AllSettingsResponseDTO {
    private Double monthlyFee;
    private Integer registrationTimeHours;
    private Integer unregistrationTimeHours;
    private Integer maxActivitiesPerDay;

    public AllSettingsResponseDTO() {
    }

    public AllSettingsResponseDTO(Double monthlyFee, Integer registrationTimeHours, Integer unregistrationTimeHours, Integer maxActivitiesPerDay) {
        this.monthlyFee = monthlyFee;
        this.registrationTimeHours = registrationTimeHours;
        this.unregistrationTimeHours = unregistrationTimeHours;
        this.maxActivitiesPerDay = maxActivitiesPerDay;
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
}
