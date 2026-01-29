package com.personalfit.services;

import java.time.LocalDate;
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

/**
 * Service Layer: Attendance & Enrollment
 * 
 * Manages user participation in activities.
 * Handles enrollment rules (quotas, capacities) and attendance tracking (Start
 * -> Present/Absent).
 */
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

    /**
     * Enrolls a user in a specific activity.
     * Enforces rules:
     * 1. No double booking.
     * 2. Activity capacity limits.
     * 3. Max activities per day limit (from Settings).
     */
    public AttendanceDTO enrollUser(Long userId, Long activityId) {
        User user = userService.getUserById(userId);
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with ID: " + activityId,
                        "Api/Attendance/enrollUser"));

        // Rule 1: Prevent double enrollment
        if (isUserEnrolled(userId, activityId)) {
            throw new BusinessRuleException("User is already enrolled in this activity", "Api/Attendance/enrollUser");
        }

        // Rule 2: Check Capacity
        if (activity.getAttendances().size() >= activity.getSlots()) {
            throw new BusinessRuleException("Activity is full", "Api/Attendance/enrollUser");
        }

        // Rule 3: Check Daily Limit
        Integer maxActivitiesPerDay = settingsService.getMaxActivitiesPerDay();
        long activitiesOnSameDay = attendanceRepository.countByUserAndActivityDate(user, activity.getDate());

        if (activitiesOnSameDay >= maxActivitiesPerDay) {
            throw new BusinessRuleException(
                    String.format("Cannot enroll in more than %d activities per day", maxActivitiesPerDay),
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

    /**
     * Unenrolls a user from an activity.
     * Assuming they haven't attended yet (logic for that isn't strictly enforced
     * here but implied by flow).
     */
    public void unenrollUser(Long userId, Long activityId) {
        User user = userService.getUserById(userId);
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with ID: " + activityId,
                        "Api/Attendance/unenrollUser"));

        Optional<Attendance> attendance = attendanceRepository.findByUserAndActivity(user, activity);
        if (attendance.isPresent()) {
            attendanceRepository.delete(attendance.get());
        } else {
            throw new BusinessRuleException("User is not enrolled in this activity", "Api/Attendance/unenrollUser");
        }
    }

    public boolean isUserEnrolled(Long userId, Long activityId) {
        User user = userService.getUserById(userId);
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with ID: " + activityId,
                        "Api/Attendance/isUserEnrolled"));

        return attendanceRepository.existsByUserAndActivity(user, activity);
    }

    /**
     * Gets list of attendances for a specific activity.
     * Used for seeing who is enrolled.
     */
    public List<AttendanceDTO> getActivityAttendances(Long activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with ID: " + activityId,
                        "Api/Attendance/getActivityAttendances"));

        return attendanceRepository.findByActivity(activity).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Gets enriched attendance list (with User Names).
     * Used for Trainer view (Taking system roll call).
     */
    public List<AttendanceDTO> getActivityAttendancesWithUserInfo(Long activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with ID: " + activityId,
                        "Api/Attendance/getActivityAttendancesWithUserInfo"));

        return attendanceRepository.findByActivity(activity).stream()
                .map(this::convertToAttendanceDTO) // Uses converter that includes User Info
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getUserAttendances(Long userId) {
        User user = userService.getUserById(userId);

        return attendanceRepository.findByUser(user).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Updates status (e.g., PENDING -> PRESENT or ABSENT).
     */
    public void updateAttendanceStatus(Long attendanceId, AttendanceStatus status) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new EntityNotFoundException("Attendance not found with ID: " + attendanceId,
                        "Api/Attendance/updateAttendanceStatus"));

        attendance.setAttendance(status);
        attendanceRepository.save(attendance);
    }

    /**
     * Auto-Absent Logic.
     * Called by ActivityService when an activity concludes.
     * Any user still 'PENDING' is marked 'ABSENT'.
     */
    public void markPendingAttendancesAsAbsent(Long activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with ID: " + activityId,
                        "Api/Attendance/markPendingAttendancesAsAbsent"));

        List<Attendance> pendingAttendances = attendanceRepository.findByActivityAndAttendance(activity,
                AttendanceStatus.PENDING);

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
                .firstName(attendance.getUser().getFirstName()) // Enriched field
                .lastName(attendance.getUser().getLastName()) // Enriched field
                .status(attendance.getAttendance())
                .createdAt(attendance.getCreatedAt())
                .updatedAt(attendance.getUpdatedAt())
                .build();
    }

    public List<Attendance> getUserAttendancesForDate(Long userId, LocalDate date) {
        User user = userService.getUserById(userId);

        return attendanceRepository.findByUser(user).stream()
                .filter(attendance -> attendance.getActivity().getDate().toLocalDate().equals(date))
                .collect(Collectors.toList());
    }
}