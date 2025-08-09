package com.personalfit.personalfit.services;

import com.personalfit.personalfit.dto.AttendanceDTO;
import com.personalfit.personalfit.utils.AttendanceStatus;

import java.util.List;

public interface IAttendanceService {

    public void markAttendance(String userId, String activityId, String status);
    
    // New methods for enrollment management
    AttendanceDTO enrollUser(Long userId, Long activityId);
    
    void unenrollUser(Long userId, Long activityId);
    
    boolean isUserEnrolled(Long userId, Long activityId);
    
    List<AttendanceDTO> getActivityAttendances(Long activityId);
    
    List<AttendanceDTO> getUserAttendances(Long userId);
    
    void updateAttendanceStatus(Long attendanceId, AttendanceStatus status);
}