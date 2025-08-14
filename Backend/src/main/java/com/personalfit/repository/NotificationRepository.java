package com.personalfit.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.personalfit.enums.NotificationStatus;
import com.personalfit.models.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserId(Long id);
    List<Notification> findByUserIdAndStatus(Long userId, NotificationStatus status);
}
