package com.personalfit.services;

import com.personalfit.dto.Attendance.AttendanceDTO;
import com.personalfit.enums.AttendanceStatus;
import com.personalfit.models.Activity;
import com.personalfit.models.Attendance;
import com.personalfit.models.User;
import com.personalfit.repository.ActivityRepository;
import com.personalfit.repository.AttendanceRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private UserService userService;

    public void markAttendance(String userId, String activityId, String status) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'markAttendance'");
    }

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

    public boolean isUserEnrolled(Long userId, Long activityId) {
        User user = userService.getUserById(userId);
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new NoActivityWithIdException("Activity not found with id: " + activityId));

        return attendanceRepository.existsByUserAndActivity(user, activity);
    }

    public List<AttendanceDTO> getActivityAttendances(Long activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new NoActivityWithIdException("Activity not found with id: " + activityId));

        return attendanceRepository.findByActivity(activity).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getUserAttendances(Long userId) {
        User user = userService.getUserById(userId);

        return attendanceRepository.findByUser(user).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

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