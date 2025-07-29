package com.personalfit.personalfit.repository;

import com.personalfit.personalfit.models.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByDateBetween(LocalDateTime dateAfter, LocalDateTime dateBefore);
}
