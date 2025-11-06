package com.personalfit.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.personalfit.models.FCMToken;

/**
 * Repository para la gestión de tokens FCM
 * Maneja todas las operaciones CRUD relacionadas con tokens de Firebase Cloud Messaging
 */
@Repository
public interface FCMTokenRepository extends JpaRepository<FCMToken, Long> {

    /**
     * Buscar token por su valor string
     * Útil para verificar si un token ya existe antes de crearlo
     */
    Optional<FCMToken> findByToken(String token);

    /**
     * Buscar todos los tokens válidos de un usuario específico
     * Se usa para enviar notificaciones push a todos los dispositivos del usuario
     */
    @Query("SELECT f FROM FCMToken f WHERE f.user.id = :userId")
    List<FCMToken> findByUserId(@Param("userId") Long userId);

    /**
     * Buscar todos los tokens válidos de múltiples usuarios
     * Útil para notificaciones masivas
     */
    @Query("SELECT f FROM FCMToken f WHERE f.user.id IN :userIds")
    List<FCMToken> findByUserIdIn(@Param("userIds") List<Long> userIds);

    /**
     * Contar cuántos tokens tiene un usuario
     * Útil para verificaciones y logs
     */
    long countByUserId(Long userId);

    /**
     * Eliminar tokens por ID de usuario
     * Útil cuando un usuario se desuscribe de todas las notificaciones
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM FCMToken f WHERE f.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    /**
     * Eliminar token por su valor string
     * Útil cuando FCM indica que un token ha expirado o es inválido
     */
    @Modifying
    @Transactional
    void deleteByToken(String token);

    /**
     * Eliminar tokens antiguos (cleanup de tokens expirados)
     * Los tokens FCM pueden expirar, se recomienda limpiar tokens antiguos periodicamente
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM FCMToken f WHERE f.updatedAt < :cutoffDate")
    void deleteTokensOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Verificar si existe un token específico para un usuario
     * Útil para evitar duplicados
     */
    boolean existsByTokenAndUserId(String token, Long userId);
}