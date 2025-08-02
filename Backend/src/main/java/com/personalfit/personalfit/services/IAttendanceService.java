package com.personalfit.personalfit.services;

public interface IAttendanceService {

    public void markAttendance(String userId, String activityId, String status);

}