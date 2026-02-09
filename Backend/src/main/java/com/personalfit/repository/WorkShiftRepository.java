package com.personalfit.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.personalfit.enums.WorkShiftStatus;
import com.personalfit.models.WorkShift;

@Repository
public interface WorkShiftRepository extends JpaRepository<WorkShift, Long> {

    // Find active shift for a trainer
    Optional<WorkShift> findByTrainerIdAndStatus(Long trainerId, WorkShiftStatus status);

    // Find all shifts for a trainer
    List<WorkShift> findByTrainerIdOrderByStartTimeDesc(Long trainerId);

    // Find all active shifts (for auto-close job)
    List<WorkShift> findByStatus(WorkShiftStatus status);
}
