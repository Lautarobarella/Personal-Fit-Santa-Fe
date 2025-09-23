package com.personalfit.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notification_preferences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "class_reminders")
    @Builder.Default
    private Boolean classReminders = true;

    @Column(name = "payment_due")
    @Builder.Default
    private Boolean paymentDue = true;

    @Column(name = "new_classes")
    @Builder.Default
    private Boolean newClasses = true;

    @Column(name = "promotions")
    @Builder.Default
    private Boolean promotions = false;

    @Column(name = "class_cancellations")
    @Builder.Default
    private Boolean classCancellations = true;

    @Column(name = "general_announcements")
    @Builder.Default
    private Boolean generalAnnouncements = true;

    /**
     * Controla si el usuario quiere recibir notificaciones push
     * Independiente de si tiene tokens de dispositivo registrados
     */
    @Column(name = "push_notifications_enabled")
    @Builder.Default
    private Boolean pushNotificationsEnabled = false;
}