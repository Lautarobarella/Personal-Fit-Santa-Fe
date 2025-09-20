package com.personalfit.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.personalfit.models.NotificationPreferences;

@Repository
public interface NotificationPreferencesRepository extends JpaRepository<NotificationPreferences, Long> {

    /**
     * Encuentra las preferencias de un usuario específico
     */
    Optional<NotificationPreferences> findByUserId(Long userId);

    /**
     * Verifica si existen preferencias para un usuario
     */
    boolean existsByUserId(Long userId);

    /**
     * Elimina las preferencias de un usuario
     */
    void deleteByUserId(Long userId);
}