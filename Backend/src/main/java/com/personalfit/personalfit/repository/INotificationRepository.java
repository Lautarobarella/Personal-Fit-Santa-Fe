package com.personalfit.personalfit.repository;

import com.personalfit.personalfit.models.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface INotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserId(Long id);
}
