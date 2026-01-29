package com.personalfit.repository;

import com.personalfit.models.Attendance;
import com.personalfit.models.User;
import com.personalfit.enums.AttendanceStatus;
import com.personalfit.models.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    /**
     * Find attendance by user and activity.
     */
    Optional<Attendance> findByUserAndActivity(User user, Activity activity);

    /**
     * Find all attendances for a specific activity.
     */
    List<Attendance> findByActivity(Activity activity);

    /**
     * Find all attendances for a specific user.
     */
    List<Attendance> findByUser(User user);

    /**
     * Check if user is enrolled in activity.
     */
    boolean existsByUserAndActivity(User user, Activity activity);

    /**
     * Delete attendance by user and activity.
     */
    void deleteByUserAndActivity(User user, Activity activity);

    /**
     * Find attendances by activity and attendance status.
     */
    List<Attendance> findByActivityAndAttendance(Activity activity, AttendanceStatus attendance);

    /**
     * Count user enrollments for a specific date.
     */
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.user = :user AND DATE(a.activity.date) = DATE(:date)")
    long countByUserAndActivityDate(@Param("user") User user, @Param("date") LocalDateTime date);
}
