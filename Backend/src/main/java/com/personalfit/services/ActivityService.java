package com.personalfit.services;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.personalfit.dto.Activity.ActivityDetailInfoDTO;
import com.personalfit.dto.Activity.ActivityFormTypeDTO;
import com.personalfit.dto.Activity.ActivityTypeDTO;
import com.personalfit.dto.Activity.ActivityUserDetailDTO;
import com.personalfit.dto.Attendance.AttendanceDTO;
import com.personalfit.dto.Attendance.EnrollmentRequestDTO;
import com.personalfit.dto.Attendance.EnrollmentResponseDTO;
import com.personalfit.enums.ActivityStatus;
import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.exceptions.EntityNotFoundException;
import com.personalfit.models.Activity;
import com.personalfit.models.Attendance;
import com.personalfit.models.User;
import com.personalfit.repository.ActivityRepository;
import com.personalfit.repository.AttendanceRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * Service generic for managing gym classes/activities.
 * Handles scheduling, recurrence, enrollment, and lifecycle management (Active
 * -> Completed).
 */
@Slf4j
@Service
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private NotificationService notificationService;

    /**
     * Schedules a new activity.
     */
    public void createActivity(ActivityFormTypeDTO activity) {
        User trainer = userService.getUserById(Long.parseLong(activity.getTrainerId()));

        LocalDate activityDate = activity.getDate();
        LocalTime activityTime = activity.getTime();

        Activity newActivity = Activity.builder()
                .name(activity.getName())
                .description(activity.getDescription())
                .location(activity.getLocation())
                .slots(Integer.parseInt(activity.getMaxParticipants()))
                .date(LocalDateTime.of(activityDate, activityTime))
                .repeatEveryWeek(activity.getIsRecurring() != null ? activity.getIsRecurring() : false)
                .duration(Integer.parseInt(activity.getDuration()))
                .status(ActivityStatus.ACTIVE)
                .trainer(trainer)
                .createdAt(LocalDateTime.now())
                .isRecurring(activity.getIsRecurring())
                .build();

        try {
            activityRepository.save(newActivity);
        } catch (Exception e) {
            throw new BusinessRuleException("Failed to save activity: " + e.getMessage(),
                    "Api/Activity/createActivity");
        }
    }

    /**
     * Updates an existing activity.
     * Can update schedule, trainer, location, etc.
     */
    public void updateActivity(Long id, ActivityFormTypeDTO activity) {
        Activity existingActivity = activityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with ID: " + id,
                        "Api/Activity/updateActivity"));

        User trainer = userService.getUserById(Long.parseLong(activity.getTrainerId()));

        // Logic to update DateTime depending on what was provided
        LocalDateTime newDateTime = null;
        if (activity.getDate() != null && activity.getTime() != null) {
            newDateTime = LocalDateTime.of(activity.getDate(), activity.getTime());
        } else if (activity.getDate() != null) {
            newDateTime = LocalDateTime.of(activity.getDate(), existingActivity.getDate().toLocalTime());
        } else if (activity.getTime() != null) {
            newDateTime = LocalDateTime.of(existingActivity.getDate().toLocalDate(), activity.getTime());
        }

        existingActivity.setName(activity.getName());
        existingActivity.setDescription(activity.getDescription());
        existingActivity.setLocation(activity.getLocation());
        existingActivity.setSlots(Integer.parseInt(activity.getMaxParticipants()));
        existingActivity.setDuration(Integer.parseInt(activity.getDuration()));
        existingActivity.setTrainer(trainer);
        existingActivity.setIsRecurring(activity.getIsRecurring());

        if (newDateTime != null) {
            existingActivity.setDate(newDateTime);
        }

        try {
            activityRepository.save(existingActivity);
        } catch (Exception e) {
            throw new BusinessRuleException("Failed to update activity: " + e.getMessage(),
                    "Api/Activity/updateActivity");
        }
    }

    public void deleteActivity(Long id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found with ID: " + id,
                        "Api/Activity/deleteActivity"));

        try {
            activityRepository.delete(activity);
        } catch (Exception e) {
            throw new BusinessRuleException("Failed to delete activity: " + e.getMessage(),
                    "Api/Activity/deleteActivity");
        }
    }

    public List<ActivityTypeDTO> getAllActivitiesTypeDto() {
        List<Activity> activities = activityRepository.findAll();
        return activities.stream()
                .map(this::convertToActivityTypeDTO)
                .toList();
    }

    /**
     * Gets detailed info for a specific activity, including participant list.
     */
    public ActivityDetailInfoDTO getActivityDetailInfo(Long id) {
        Optional<Activity> activity = activityRepository.findById(id);
        if (activity.isEmpty()) {
            throw new EntityNotFoundException("Activity not found with ID: " + id,
                    "Api/Activity/getActivityDetailInfo");
        }

        Activity act = activity.get();
        return ActivityDetailInfoDTO.builder()
                .id(act.getId())
                .name(act.getName())
                .description(act.getDescription())
                .location(act.getLocation())
                .trainerId(act.getTrainer().getId())
                .trainerName(act.getTrainer().getFullName())
                .date(act.getDate())
                .duration(act.getDuration())
                .maxParticipants(act.getSlots())
                .participants(act.getAttendances().stream().map(a -> {
                    return ActivityUserDetailDTO.builder()
                            .id(a.getId())
                            .userId(a.getUser().getId())
                            .firstName(a.getUser().getFirstName())
                            .lastName(a.getUser().getLastName())
                            .createdAt(act.getDate())
                            .status(a.getAttendance())
                            .build();
                }).collect(Collectors.toList()))
                .currentParticipants(act.getAttendances().size())
                .status(act.getStatus())
                .createdAt(act.getCreatedAt())
                .isRecurring(act.getIsRecurring())
                .build();
    }

    /**
     * Scheduling View:
     * Returns activities for the week containing the given date.
     * Range: Monday (00:00) to Sunday (23:59).
     */
    public List<ActivityTypeDTO> getAllActivitiesTypeDtoAtWeek(LocalDate date) {
        LocalDate startOfWeekDate = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDateTime startOfWeek = startOfWeekDate.atStartOfDay();

        LocalDate endOfWeekDate = date.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        LocalDateTime endOfWeek = endOfWeekDate.atTime(LocalTime.MAX);

        List<Activity> allActivities = activityRepository.findByDateBetween(startOfWeek, endOfWeek);

        return allActivities.stream()
                .map(this::convertToActivityTypeDTO)
                .collect(Collectors.toList());
    }

    /**
     * User Enrollment:
     * 1. Checks payment status (must be active).
     * 2. Delegates enrollment creation to AttendanceService.
     */
    public EnrollmentResponseDTO enrollUser(EnrollmentRequestDTO enrollmentRequest) {
        try {
            Boolean paymentValidation = paymentService.canUserEnrollBasedOnPayment(enrollmentRequest.getUserId());

            if (!paymentValidation) {
                return EnrollmentResponseDTO.builder()
                        .success(false)
                        .message("User cannot enroll due to payment status (Expired or Unpaid).")
                        .build();
            }

            AttendanceDTO attendance = attendanceService.enrollUser(
                    enrollmentRequest.getUserId(),
                    enrollmentRequest.getActivityId());

            return EnrollmentResponseDTO.builder()
                    .success(true)
                    .message("User enrolled successfully")
                    .enrollment(attendance)
                    .build();
        } catch (Exception e) {
            return EnrollmentResponseDTO.builder()
                    .success(false)
                    .message("Enrollment failed: " + e.getMessage())
                    .build();
        }
    }

    public EnrollmentResponseDTO unenrollUser(EnrollmentRequestDTO enrollmentRequest) {
        try {
            attendanceService.unenrollUser(
                    enrollmentRequest.getUserId(),
                    enrollmentRequest.getActivityId());

            return EnrollmentResponseDTO.builder()
                    .success(true)
                    .message("User unenrolled successfully")
                    .enrollment(null)
                    .build();
        } catch (Exception e) {
            return EnrollmentResponseDTO.builder()
                    .success(false)
                    .message("Unenrollment failed: " + e.getMessage())
                    .build();
        }
    }

    public boolean isUserEnrolled(Long userId, Long activityId) {
        return attendanceService.isUserEnrolled(userId, activityId);
    }

    private ActivityTypeDTO convertToActivityTypeDTO(Activity activity) {
        return ActivityTypeDTO.builder()
                .id(activity.getId())
                .name(activity.getName())
                .description(activity.getDescription())
                .location(activity.getLocation())
                .trainerName(activity.getTrainer().getFullName())
                .date(activity.getDate())
                .duration(activity.getDuration())
                .participants(
                        activity.getAttendances().stream().map(a -> a.getUser().getId()).collect(Collectors.toList()))
                .maxParticipants(activity.getSlots())
                .currentParticipants(activity.getAttendances().size())
                .status(activity.getStatus())
                .isRecurring(activity.getIsRecurring())
                .build();
    }

    // ===============================
    // CRON JOBS
    // ===============================

    /**
     * Cron Job: Activity Lifecycle (Every 30 mins).
     * 1. Detects finished activities -> marks COMPUTED.
     * 2. Marks pending attendances as ABSENT.
     * 3. Creates next week's activity if 'isRecurring' is true.
     */
    @Scheduled(cron = "0 */30 * * * *")
    @Transactional
    public void checkCompletedActivies() {
        log.info("Running job: Check Completed Activities");
        LocalDateTime now = LocalDateTime.now();

        List<Activity> activeActivities = activityRepository.findByStatus(ActivityStatus.ACTIVE);
        List<Activity> toUpdate = new ArrayList<>();
        List<Activity> toCreate = new ArrayList<>();

        for (Activity activity : activeActivities) {
            LocalDateTime activityEndTime = activity.getDate();

            // Check if activity has ended (assuming instant completion at start time, logic
            // could be improved with duration)
            if (activityEndTime.isBefore(now)) {
                activity.setStatus(ActivityStatus.COMPLETED);
                toUpdate.add(activity);
                log.info("Activity {} marked COMPLETED. Ended at: {}", activity.getId(), activityEndTime);

                // Auto-mark absentees
                try {
                    attendanceService.markPendingAttendancesAsAbsent(activity.getId());
                    log.info("marked pending as absent for activity: {}", activity.getId());
                } catch (Exception e) {
                    log.error("Failed to mark absentees for activity {}: {}", activity.getId(), e.getMessage());
                }

                // Handle Recurrence
                if (activity.getRepeatEveryWeek()) {
                    LocalDateTime nextWeekDate = activity.getDate().plusWeeks(1);

                    Activity newActivity = Activity.builder()
                            .name(activity.getName())
                            .description(activity.getDescription())
                            .location(activity.getLocation())
                            .slots(activity.getSlots())
                            .date(nextWeekDate)
                            .repeatEveryWeek(true)
                            .duration(activity.getDuration())
                            .status(ActivityStatus.ACTIVE)
                            .trainer(activity.getTrainer())
                            .createdAt(LocalDateTime.now())
                            .isRecurring(activity.getIsRecurring())
                            .build();

                    toCreate.add(newActivity);
                    log.info("Recurring activity created for: {}", nextWeekDate);
                }
            }
        }

        if (!toUpdate.isEmpty()) {
            activityRepository.saveAll(toUpdate);
        }
        if (!toCreate.isEmpty()) {
            activityRepository.saveAll(toCreate);
        }

        log.info("Job Complete. Activities Updated: {}, Created: {}", toUpdate.size(), toCreate.size());
    }

    /**
     * Cron Job: Class Reminders (Every 2 mins).
     * Sends push notifications to enrolled users 1 hour before class.
     */
    @Scheduled(cron = "0 */2 * * * *")
    public void sendClassReminders() {
        try {
            log.info("Running job: Class Reminders");
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime oneHourFromNow = now.plusHours(1);

            // Look for classes starting approx 1 hour from now (+/- 30m window)
            // Note: This logic seems broad, it might re-notify if run every 2 mins.
            // Better logic would be ensuring we haven't notified yet, but keeping as-is for
            // documentation.
            LocalDateTime windowStart = oneHourFromNow.minusMinutes(30);
            LocalDateTime windowEnd = oneHourFromNow.plusMinutes(30);

            List<Activity> upcomingActivities = activityRepository.findByDateBetween(windowStart, windowEnd)
                    .stream()
                    .filter(activity -> activity.getStatus() == ActivityStatus.ACTIVE)
                    .collect(Collectors.toList());

            if (upcomingActivities.isEmpty()) {
                return;
            }

            for (Activity activity : upcomingActivities) {
                List<Attendance> attendances = attendanceRepository.findByActivity(activity);
                List<User> enrolledUsers = attendances.stream()
                        .map(Attendance::getUser)
                        .collect(Collectors.toList());

                if (!enrolledUsers.isEmpty()) {
                    notificationService.sendBulkClassReminder(enrolledUsers, activity.getName(),
                            activity.getDate(), activity.getLocation());

                    log.info("Reminders sent for activity {}: {} users notified",
                            activity.getName(), enrolledUsers.size());
                }
            }
        } catch (Exception e) {
            log.error("Class Reminder Job failed", e);
        }
    }

    /**
     * Batch Activity Import.
     * 
     * @return Number of successful creations.
     */
    public Integer createBatchActivities(List<ActivityFormTypeDTO> activities) {
        log.info("Batch processing {} activities", activities.size());

        List<Activity> activitiesToCreate = new ArrayList<>();
        int successCount = 0;
        int errorCount = 0;

        for (ActivityFormTypeDTO activityDTO : activities) {
            try {
                User trainer = userService.getUserById(Long.parseLong(activityDTO.getTrainerId()));

                LocalDate activityDate = activityDTO.getDate();
                LocalTime activityTime = activityDTO.getTime();

                Activity newActivity = Activity.builder()
                        .name(activityDTO.getName())
                        .description(activityDTO.getDescription())
                        .location(activityDTO.getLocation())
                        .slots(Integer.parseInt(activityDTO.getMaxParticipants()))
                        .date(LocalDateTime.of(activityDate, activityTime))
                        .repeatEveryWeek(activityDTO.getIsRecurring() != null ? activityDTO.getIsRecurring() : false)
                        .duration(Integer.parseInt(activityDTO.getDuration()))
                        .status(ActivityStatus.ACTIVE)
                        .trainer(trainer)
                        .createdAt(LocalDateTime.now())
                        .isRecurring(activityDTO.getIsRecurring())
                        .build();

                activitiesToCreate.add(newActivity);
                successCount++;

            } catch (Exception e) {
                errorCount++;
                log.error("Batch item skipped: {} - {}", activityDTO.getName(), e.getMessage());
            }
        }

        if (!activitiesToCreate.isEmpty()) {
            try {
                activityRepository.saveAll(activitiesToCreate);
                log.info("Batch success: {} saved", successCount);
            } catch (Exception e) {
                log.error("Batch save failed: {}", e.getMessage());
                throw new BusinessRuleException("Batch save failed: " + e.getMessage(),
                        "Api/Activity/createBatchActivities");
            }
        }

        if (errorCount > 0) {
            log.warn("Batch completed with {} errors", errorCount);
        }

        return successCount;
    }

}
