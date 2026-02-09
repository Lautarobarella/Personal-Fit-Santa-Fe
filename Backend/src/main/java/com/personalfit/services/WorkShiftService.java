package com.personalfit.services;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.personalfit.enums.WorkShiftStatus;
import com.personalfit.models.User;
import com.personalfit.models.WorkShift;
import com.personalfit.repository.WorkShiftRepository;

@Service
public class WorkShiftService {

    @Autowired
    private WorkShiftRepository workShiftRepository;

    /**
     * Handles Check-in and Check-out logic.
     * If no active shift -> Check-in
     * If active shift -> Check-out
     */
    public String processCheckInCheckOut(User trainer) {
        Optional<WorkShift> activeShiftOpt = workShiftRepository.findByTrainerIdAndStatus(trainer.getId(),
                WorkShiftStatus.ACTIVE);

        if (activeShiftOpt.isPresent()) {
            return checkOut(activeShiftOpt.get());
        } else {
            return checkIn(trainer);
        }
    }

    private String checkIn(User trainer) {
        WorkShift shift = WorkShift.builder()
                .trainer(trainer)
                .startTime(LocalDateTime.now())
                .status(WorkShiftStatus.ACTIVE)
                .build();

        workShiftRepository.save(shift);
        return "CHECK_IN";
    }

    private String checkOut(WorkShift shift) {
        LocalDateTime now = LocalDateTime.now();
        shift.setEndTime(now);
        shift.setStatus(WorkShiftStatus.COMPLETED);

        // Calculate duration in hours
        Duration duration = Duration.between(shift.getStartTime(), now);
        double hours = (double) duration.toMinutes() / 60.0;
        shift.setTotalHours(hours);

        workShiftRepository.save(shift);
        return "CHECK_OUT";
    }

    public Optional<WorkShift> getCurrentShift(Long trainerId) {
        return workShiftRepository.findByTrainerIdAndStatus(trainerId, WorkShiftStatus.ACTIVE);
    }

    public List<WorkShift> getShiftHistory(Long trainerId) {
        return workShiftRepository.findByTrainerIdOrderByStartTimeDesc(trainerId);
    }

    /**
     * Auto-close shifts that have been active for too long (e.g., > 12 hours).
     * This prevents forgotten check-outs from skewing data.
     */
    @Scheduled(cron = "0 0 * * * *") // Run every hour
    public void autoCloseStaleShifts() {
        List<WorkShift> activeShifts = workShiftRepository.findByStatus(WorkShiftStatus.ACTIVE);
        LocalDateTime now = LocalDateTime.now();

        for (WorkShift shift : activeShifts) {
            // If shift started more than 12 hours ago
            if (shift.getStartTime().plusHours(12).isBefore(now)) {
                shift.setEndTime(now);
                shift.setStatus(WorkShiftStatus.AUTO_CLOSED);

                // Calculate hours until now (capped or as is, depending on policy)
                // Here we cap it at 12 hours or just mark it. Let's record actual time but
                // status indicates issue.
                Duration duration = Duration.between(shift.getStartTime(), now);
                double hours = (double) duration.toMinutes() / 60.0;
                shift.setTotalHours(hours);

                workShiftRepository.save(shift);

                // TODO: Notify Admin and Trainer about auto-close
                System.out.println("Auto-closed shift for trainer: " + shift.getTrainer().getFullName());
            }
        }
    }
}
