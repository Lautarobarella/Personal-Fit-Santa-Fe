package com.personalfit.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad FCMToken para gestionar tokens de Firebase Cloud Messaging
 * Cada token representa una instancia de la aplicación en un dispositivo específico
 * Un usuario puede tener múltiples tokens (diferentes dispositivos/navegadores)
 */
@Entity
@Table(name = "fcm_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FCMToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Relación Many-to-One con User
     * Un usuario puede tener múltiples tokens FCM
     */
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Token FCM único para identificar la instancia de la aplicación
     */
    @Column(name = "token", unique = true, nullable = false, length = 1024)
    private String token;

    /**
     * Información opcional del dispositivo/navegador
     * Puede incluir User-Agent, nombre del dispositivo, etc.
     */
    @Column(name = "device_info", length = 500)
    private String deviceInfo;

    /**
     * Fecha de creación del token
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * Fecha de última actualización del token
     */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}