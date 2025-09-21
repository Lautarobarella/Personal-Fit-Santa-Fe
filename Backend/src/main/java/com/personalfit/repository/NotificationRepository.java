package com.personalfit.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.personalfit.enums.NotificationStatus;
import com.personalfit.models.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserId(Long id);
    List<Notification> findByUserIdAndStatus(Long userId, NotificationStatus status);
    
    /**
     * Encuentra notificaciones de un usuario creadas después de una fecha específica
     */
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.date >= :fromDate ORDER BY n.date DESC")
    List<Notification> findByUserIdAndDateAfter(@Param("userId") Long userId, @Param("fromDate") LocalDateTime fromDate);
}
