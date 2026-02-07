package com.personalfit.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.personalfit.models.ActivitySummary;
import com.personalfit.models.Attendance;

@Repository
public interface ActivitySummaryRepository extends JpaRepository<ActivitySummary, Long> {

    Optional<ActivitySummary> findByAttendance(Attendance attendance);
}
