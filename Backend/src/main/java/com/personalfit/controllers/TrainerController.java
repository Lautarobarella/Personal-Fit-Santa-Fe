package com.personalfit.controllers;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.dto.Trainer.TrainerDashboardStatsDTO;
import com.personalfit.dto.Activity.TrainerActivityDTO;

import com.personalfit.enums.ActivityStatus;
import com.personalfit.enums.WorkShiftStatus;
import com.personalfit.models.Activity;
import com.personalfit.models.WorkShift;
import com.personalfit.repository.ActivityRepository;
import com.personalfit.repository.WorkShiftRepository;
import com.personalfit.services.ActivityService;

@RestController
@RequestMapping("/api/trainer")
public class TrainerController {

    @Autowired
    private ActivityService activityService; // Assuming exists

    @Autowired
    private ActivityRepository activityRepository; // Direct access for custom queries if needed

    @Autowired
    private WorkShiftRepository workShiftRepository;

    @GetMapping("/{trainerId}/dashboard-stats")
    @PreAuthorize("hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<TrainerDashboardStatsDTO> getDashboardStats(@PathVariable Long trainerId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();

        // 1. Classes Today
        // Assuming ActivityRepository has a method or we list all and filter
        // efficiently
        // Using repository directly for cleaner query if possible, or service
        List<Activity> trainerActivities = activityRepository.findByTrainerId(trainerId);

        long classesToday = trainerActivities.stream()
                .filter(a -> a.getDate().toLocalDate().equals(today) && a.getStatus() != ActivityStatus.CANCELLED)
                .count();

        // 2. Next Class
        Optional<Activity> nextClass = trainerActivities.stream()
                .filter(a -> a.getDate().isAfter(now) && a.getStatus() != ActivityStatus.CANCELLED)
                .sorted((a1, a2) -> a1.getDate().compareTo(a2.getDate()))
                .findFirst();

        // 3. Current Shift Hours
        Optional<WorkShift> currentShift = workShiftRepository.findByTrainerIdAndStatus(trainerId,
                WorkShiftStatus.ACTIVE);
        Double currentShiftHours = 0.0;
        if (currentShift.isPresent()) {
            long minutes = ChronoUnit.MINUTES.between(currentShift.get().getStartTime(), now);
            currentShiftHours = minutes / 60.0;
        }

        // 4. Weekly Hours
        LocalDate startOfWeek = today.with(DayOfWeek.MONDAY);
        List<WorkShift> weeklyShifts = workShiftRepository.findByTrainerIdOrderByStartTimeDesc(trainerId);

        Double weeklyHours = weeklyShifts.stream()
                .filter(s -> s.getStartTime().toLocalDate().isAfter(startOfWeek.minusDays(1)))
                .mapToDouble(s -> s.getTotalHours() != null ? s.getTotalHours() : 0.0)
                .sum();

        // Add current shift hours to weekly total if active
        if (currentShift.isPresent()) {
            weeklyHours += currentShiftHours;
        }

        return ResponseEntity.ok(TrainerDashboardStatsDTO.builder()
                .classesToday((int) classesToday)
                .nextClassName(nextClass.map(Activity::getName).orElse(null))
                .nextClassTime(nextClass.map(Activity::getDate).orElse(null))
                .currentShiftHours(currentShiftHours)
                .weeklyHours(weeklyHours)
                .activeClients(0) // Placeholder
                .attendanceRate(0.0) // Placeholder
                .build());
    }

    @GetMapping("/{trainerId}/activities")
    @PreAuthorize("hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<List<TrainerActivityDTO>> getTrainerActivities(@PathVariable Long trainerId,
            @RequestParam(required = false) String date) {
        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        LocalDateTime startOfDay = targetDate.atStartOfDay();
        LocalDateTime endOfDay = targetDate.atTime(LocalTime.MAX);

        List<Activity> activities = activityRepository.findByTrainerId(trainerId);

        List<TrainerActivityDTO> daysActivities = activities.stream()
                .filter(a -> !a.getDate().isBefore(startOfDay) && !a.getDate().isAfter(endOfDay))
                .filter(a -> a.getStatus() != ActivityStatus.CANCELLED)
                .sorted((a1, a2) -> a1.getDate().compareTo(a2.getDate()))
                .map(a -> TrainerActivityDTO.builder()
                        .id(a.getId())
                        .name(a.getName())
                        .date(a.getDate())
                        .duration(a.getDuration())
                        .maxParticipants(a.getSlots())
                        .currentParticipants(a.getAttendances() != null ? a.getAttendances().size() : 0)
                        .status(a.getStatus().name())
                        .build())
                .toList();

        return ResponseEntity.ok(daysActivities);
    }
}
