package com.personalfit.repository;

import com.personalfit.enums.ActivityStatus;
import com.personalfit.models.Activity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByDateBetween(LocalDateTime dateAfter, LocalDateTime dateBefore);

    List<Activity> findByDateBeforeAndStatus(LocalDateTime date, ActivityStatus activityStatus);
    
    List<Activity> findByStatus(ActivityStatus status);
}
