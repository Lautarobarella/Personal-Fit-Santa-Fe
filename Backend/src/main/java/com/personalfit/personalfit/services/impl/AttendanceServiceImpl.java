package com.personalfit.personalfit.services.impl;

import com.personalfit.personalfit.dto.AttendanceDTO;
import com.personalfit.personalfit.exceptions.NoActivityWithIdException;
import com.personalfit.personalfit.exceptions.NoUserWithIdException;
import com.personalfit.personalfit.models.Activity;
import com.personalfit.personalfit.models.Attendance;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.IActivityRepository;
import com.personalfit.personalfit.repository.IAttendanceRepository;
import com.personalfit.personalfit.services.IAttendanceService;
import com.personalfit.personalfit.services.IUserService;
import com.personalfit.personalfit.utils.AttendanceStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AttendanceServiceImpl implements IAttendanceService {

    @Autowired
    private IAttendanceRepository attendanceRepository;
    
    @Autowired
    private IActivityRepository activityRepository;
    
    @Autowired
    private IUserService userService;

    @Override
    public void markAttendance(String userId, String activityId, String status) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'markAttendance'");
    }
    
    @Override
    public AttendanceDTO enrollUser(Long userId, Long activityId) {
        User user = userService.getUserById(userId);
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new NoActivityWithIdException("Activity not found with id: " + activityId));
        
        // Check if user is already enrolled
        if (isUserEnrolled(userId, activityId)) {
            throw new RuntimeException("User is already enrolled in this activity");
        }
        
        // Check if activity has available slots
        if (activity.getAttendances().size() >= activity.getSlots()) {
            throw new RuntimeException("Activity is full");
        }
        
        Attendance attendance = new Attendance();
        attendance.setUser(user);
        attendance.setActivity(activity);
        attendance.setAttendance(AttendanceStatus.pending);
        
        Attendance savedAttendance = attendanceRepository.save(attendance);
        
        return AttendanceDTO.builder()
                .id(savedAttendance.getId())
                .activityId(savedAttendance.getActivity().getId())
                .userId(savedAttendance.getUser().getId())
                .status(savedAttendance.getAttendance())
                .createdAt(savedAttendance.getCreatedAt())
                .updatedAt(savedAttendance.getUpdatedAt())
                .build();
    }
    
    @Override
    public void unenrollUser(Long userId, Long activityId) {
        User user = userService.getUserById(userId);
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new NoActivityWithIdException("Activity not found with id: " + activityId));
        
        Optional<Attendance> attendance = attendanceRepository.findByUserAndActivity(user, activity);
        if (attendance.isPresent()) {
            attendanceRepository.delete(attendance.get());
        } else {
            throw new RuntimeException("User is not enrolled in this activity");
        }
    }
    
    @Override
    public boolean isUserEnrolled(Long userId, Long activityId) {
        User user = userService.getUserById(userId);
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new NoActivityWithIdException("Activity not found with id: " + activityId));
        
        return attendanceRepository.existsByUserAndActivity(user, activity);
    }
    
    @Override
    public List<AttendanceDTO> getActivityAttendances(Long activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new NoActivityWithIdException("Activity not found with id: " + activityId));
        
        return attendanceRepository.findByActivity(activity).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<AttendanceDTO> getUserAttendances(Long userId) {
        User user = userService.getUserById(userId);
        
        return attendanceRepository.findByUser(user).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public void updateAttendanceStatus(Long attendanceId, AttendanceStatus status) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new RuntimeException("Attendance not found with id: " + attendanceId));
        
        attendance.setAttendance(status);
        attendanceRepository.save(attendance);
    }
    
    private AttendanceDTO convertToDTO(Attendance attendance) {
        return AttendanceDTO.builder()
                .id(attendance.getId())
                .activityId(attendance.getActivity().getId())
                .userId(attendance.getUser().getId())
                .status(attendance.getAttendance())
                .createdAt(attendance.getCreatedAt())
                .updatedAt(attendance.getUpdatedAt())
                .build();
    }
}