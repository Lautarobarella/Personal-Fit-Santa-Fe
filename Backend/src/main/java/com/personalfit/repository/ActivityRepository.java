package com.personalfit.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.personalfit.enums.ActivityStatus;
import com.personalfit.models.Activity;
import com.personalfit.models.User;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByDateBetween(LocalDateTime dateAfter, LocalDateTime dateBefore);

    List<Activity> findByDateBeforeAndStatus(LocalDateTime date, ActivityStatus activityStatus);
    
    List<Activity> findByStatus(ActivityStatus status);
    
    // Métodos para actividades recurrentes
    List<Activity> findByIsRecurringTrueAndStatus(ActivityStatus status);
    
    // Método para verificar si ya existe una actividad similar en una fecha específica
    boolean existsByNameAndTrainerAndDateBetween(String name, User trainer, LocalDateTime startDate, LocalDateTime endDate);
}
