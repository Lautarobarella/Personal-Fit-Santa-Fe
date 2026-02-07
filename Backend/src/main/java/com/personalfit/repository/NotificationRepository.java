package com.personalfit.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.personalfit.enums.NotificationStatus;
import com.personalfit.models.Notification;
import com.personalfit.models.User;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUser(User user);
    
    List<Notification> findByUserAndStatus(User user, NotificationStatus status);
    
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    
    List<Notification> findByUserAndStatusOrderByCreatedAtDesc(User user, NotificationStatus status);

    long deleteByStatusNot(NotificationStatus status);
}
