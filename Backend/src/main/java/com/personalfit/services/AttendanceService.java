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

    @Autowired
    private SettingsService settingsService;

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

        // Check maximum activities per day limit
        Integer maxActivitiesPerDay = settingsService.getMaxActivitiesPerDay();
        long activitiesOnSameDay = attendanceRepository.countByUserAndActivityDate(user, activity.getDate());
        
        if (activitiesOnSameDay >= maxActivitiesPerDay) {
            throw new BusinessRuleException(
                String.format("No se puede inscribir a más de %d actividades por día", maxActivitiesPerDay), 
                "Api/Attendance/enrollUser");
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

    public List<AttendanceDTO> getActivityAttendancesWithUserInfo(Long activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Actividad con ID: " + activityId + " no encontrada", "Api/Attendance/getActivityAttendancesWithUserInfo"));

        return attendanceRepository.findByActivity(activity).stream()
                .map(this::convertToAttendanceDTO)
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

    /**
     * Marca como ausentes a todos los participantes que estén en estado PENDING de una actividad
     * @param activityId ID de la actividad
     */
    public void markPendingAttendancesAsAbsent(Long activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Actividad con ID: " + activityId + " no encontrada", "Api/Attendance/markPendingAttendancesAsAbsent"));

        List<Attendance> pendingAttendances = attendanceRepository.findByActivityAndAttendance(activity, AttendanceStatus.PENDING);
        
        for (Attendance attendance : pendingAttendances) {
            attendance.setAttendance(AttendanceStatus.ABSENT);
        }
        
        if (!pendingAttendances.isEmpty()) {
            attendanceRepository.saveAll(pendingAttendances);
        }
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

    private AttendanceDTO convertToAttendanceDTO(Attendance attendance) {
        return AttendanceDTO.builder()
                .id(attendance.getId())
                .activityId(attendance.getActivity().getId())
                .userId(attendance.getUser().getId())
                .firstName(attendance.getUser().getFirstName())
                .lastName(attendance.getUser().getLastName())
                .status(attendance.getAttendance())
                .createdAt(attendance.getCreatedAt())
                .updatedAt(attendance.getUpdatedAt())
                .build();
    }
}