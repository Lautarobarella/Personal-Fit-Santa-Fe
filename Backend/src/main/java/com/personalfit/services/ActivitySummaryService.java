package com.personalfit.services;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.personalfit.dto.Activity.ActivitySummaryDTO;
import com.personalfit.dto.Activity.ActivitySummaryUpsertDTO;
import com.personalfit.enums.ActivityStatus;
import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.exceptions.EntityNotFoundException;
import com.personalfit.models.Activity;
import com.personalfit.models.ActivitySummary;
import com.personalfit.models.Attendance;
import com.personalfit.models.User;
import com.personalfit.repository.ActivityRepository;
import com.personalfit.repository.ActivitySummaryRepository;
import com.personalfit.repository.AttendanceRepository;

@Service
public class ActivitySummaryService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private ActivitySummaryRepository activitySummaryRepository;

    @Autowired
    private UserService userService;

    @Transactional
    public ActivitySummaryDTO upsertSummary(Long activityId, String userEmail, ActivitySummaryUpsertDTO request) {
        User user = userService.getUserByEmail(userEmail);
        Activity activity = getActivityById(activityId);

        validateActivitySummaryRules(activity);

        Attendance attendance = attendanceRepository.findByUserAndActivity(user, activity)
                .orElseThrow(() -> new BusinessRuleException("User is not enrolled in this activity",
                        "Api/ActivitySummary/upsertSummary"));

        ActivitySummary summary = activitySummaryRepository.findByAttendance(attendance)
                .orElseGet(ActivitySummary::new);

        summary.setAttendance(attendance);
        summary.setMuscleGroup(request.getMuscleGroup());
        summary.setEffortLevel(request.getEffortLevel());
        summary.setTrainingDescription(request.getTrainingDescription().trim());

        ActivitySummary savedSummary = activitySummaryRepository.save(summary);
        return convertToDTO(savedSummary);
    }

    @Transactional(readOnly = true)
    public ActivitySummaryDTO getCurrentUserSummary(Long activityId, String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        Activity activity = getActivityById(activityId);
        Attendance attendance = attendanceRepository.findByUserAndActivity(user, activity)
                .orElseThrow(() -> new BusinessRuleException("User is not enrolled in this activity",
                        "Api/ActivitySummary/getCurrentUserSummary"));

        return activitySummaryRepository.findByAttendance(attendance)
                .map(this::convertToDTO)
                .orElse(null);
    }

    private Activity getActivityById(Long activityId) {
        return activityRepository.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with ID: " + activityId,
                        "Api/ActivitySummary/getActivityById"));
    }

    private void validateActivitySummaryRules(Activity activity) {
        if (activity.getStatus().equals(ActivityStatus.CANCELLED)) {
            throw new BusinessRuleException("Cannot create a summary for a cancelled activity",
                    "Api/ActivitySummary/validateActivitySummaryRules");
        }

        boolean isCompleted = activity.getStatus().equals(ActivityStatus.COMPLETED);
        boolean isPastActivity = activity.getDate().isBefore(LocalDateTime.now());

        if (!isCompleted && !isPastActivity) {
            throw new BusinessRuleException("Activity summary can only be created after the activity ends",
                    "Api/ActivitySummary/validateActivitySummaryRules");
        }
    }

    private ActivitySummaryDTO convertToDTO(ActivitySummary summary) {
        return ActivitySummaryDTO.builder()
                .id(summary.getId())
                .muscleGroup(summary.getMuscleGroup())
                .effortLevel(summary.getEffortLevel())
                .trainingDescription(summary.getTrainingDescription())
                .createdAt(summary.getCreatedAt())
                .updatedAt(summary.getUpdatedAt())
                .build();
    }
}
