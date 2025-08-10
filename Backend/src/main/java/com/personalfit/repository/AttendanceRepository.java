package com.personalfit.repository;

import com.personalfit.models.Attendance;
import com.personalfit.models.User;
import com.personalfit.models.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    
    // Find attendance by user and activity
    Optional<Attendance> findByUserAndActivity(User user, Activity activity);
    
    // Find all attendances for a specific activity
    List<Attendance> findByActivity(Activity activity);
    
    // Find all attendances for a specific user
    List<Attendance> findByUser(User user);
    
    // Check if user is enrolled in activity
    boolean existsByUserAndActivity(User user, Activity activity);
    
    // Delete attendance by user and activity
    void deleteByUserAndActivity(User user, Activity activity);
}
