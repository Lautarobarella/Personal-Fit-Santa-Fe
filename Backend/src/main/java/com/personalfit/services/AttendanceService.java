package com.personalfit.services;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.personalfit.dto.Attendance.AttendanceDTO;
import com.personalfit.enums.AttendanceStatus;
import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.exceptions.EntityNotFoundException;
import com.personalfit.models.Activity;
import com.personalfit.models.Attendance;
import com.personalfit.models.User;
import com.personalfit.repository.ActivityRepository;
import com.personalfit.repository.AttendanceRepository;

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
                .orElseThrow(() -> new EntityNotFoundException("Actividad con ID: " + activityId + " no encontrada", "Api/Attendance/enrollUser"));

        // Check if user is already enrolled
        if (isUserEnrolled(userId, activityId)) {
            throw new BusinessRuleException("El usuario ya está inscrito en esta actividad", "Api/Attendance/enrollUser");
        }

        // Check if activity has available slots
        if (activity.getAttendances().size() >= activity.getSlots()) {
            throw new BusinessRuleException("La actividad está completa", "Api/Attendance/enrollUser");
        }

        Attendance attendance = new Attendance();
        attendance.setUser(user);
        attendance.setActivity(activity);
        attendance.setAttendance(AttendanceStatus.PENDING);

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
                .orElseThrow(() -> new EntityNotFoundException("Actividad con ID: " + activityId + " no encontrada", "Api/Attendance/unenrollUser"));

        Optional<Attendance> attendance = attendanceRepository.findByUserAndActivity(user, activity);
        if (attendance.isPresent()) {
            attendanceRepository.delete(attendance.get());
        } else {
            throw new BusinessRuleException("El usuario no está inscrito en esta actividad", "Api/Attendance/unenrollUser");
        }
    }

    public boolean isUserEnrolled(Long userId, Long activityId) {
        User user = userService.getUserById(userId);
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Actividad con ID: " + activityId + " no encontrada", "Api/Attendance/isUserEnrolled"));

        return attendanceRepository.existsByUserAndActivity(user, activity);
    }

    public List<AttendanceDTO> getActivityAttendances(Long activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Actividad con ID: " + activityId + " no encontrada", "Api/Attendance/getActivityAttendances"));

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
                .orElseThrow(() -> new EntityNotFoundException("Asistencia con ID: " + attendanceId + " no encontrada", "Api/Attendance/updateAttendanceStatus"));

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