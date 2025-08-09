package com.personalfit.personalfit.repository;

import com.personalfit.personalfit.models.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface INotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserId(Long id);
    
    List<Notification> findByUserIdAndReadOrderByDateDesc(Long userId, Boolean read);
    
    List<Notification> findByUserIdAndArchivedOrderByDateDesc(Long userId, Boolean archived);
    
    @Modifying
    @Query("UPDATE Notification n SET n.read = :read WHERE n.id = :id")
    void updateReadStatus(@Param("id") Long id, @Param("read") Boolean read);
    
    @Modifying
    @Query("UPDATE Notification n SET n.archived = :archived WHERE n.id = :id")
    void updateArchivedStatus(@Param("id") Long id, @Param("archived") Boolean archived);
    
    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId AND n.read = false")
    void markAllAsReadByUserId(@Param("userId") Long userId);
    
    Long countByUserIdAndRead(Long userId, Boolean read);
}
