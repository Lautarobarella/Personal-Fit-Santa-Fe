package com.personalfit.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.personalfit.enums.DeviceType;
import com.personalfit.models.UserDeviceToken;

@Repository
public interface UserDeviceTokenRepository extends JpaRepository<UserDeviceToken, Long> {

    /**
     * Encuentra todos los tokens activos de un usuario
     */
    List<UserDeviceToken> findByUserIdAndIsActiveTrue(Long userId);

    /**
     * Encuentra un token específico
     */
    Optional<UserDeviceToken> findByToken(String token);

    /**
     * Encuentra tokens por usuario y tipo de dispositivo
     */
    List<UserDeviceToken> findByUserIdAndDeviceTypeAndIsActiveTrue(Long userId, DeviceType deviceType);

    /**
     * Verifica si existe un token específico para un usuario
     */
    boolean existsByUserIdAndToken(Long userId, String token);

    /**
     * Elimina un token específico
     */
    void deleteByToken(String token);

    /**
     * Desactiva un token específico
     */
    @Modifying
    @Query("UPDATE UserDeviceToken udt SET udt.isActive = false WHERE udt.token = :token")
    void deactivateByToken(@Param("token") String token);

    /**
     * Desactiva todos los tokens de un usuario
     */
    @Modifying
    @Query("UPDATE UserDeviceToken udt SET udt.isActive = false WHERE udt.user.id = :userId")
    void deactivateAllByUserId(@Param("userId") Long userId);

    /**
     * Encuentra tokens que no han sido usados en un período específico
     */
    @Query("SELECT udt FROM UserDeviceToken udt WHERE udt.lastUsed < :cutoffDate AND udt.isActive = true")
    List<UserDeviceToken> findInactiveTokens(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Actualiza el último uso de un token
     */
    @Modifying
    @Query("UPDATE UserDeviceToken udt SET udt.lastUsed = :lastUsed WHERE udt.token = :token")
    void updateLastUsed(@Param("token") String token, @Param("lastUsed") LocalDateTime lastUsed);

    /**
     * Cuenta tokens activos por usuario
     */
    long countByUserIdAndIsActiveTrue(Long userId);

    /**
     * Obtiene todos los tokens activos (para envío masivo)
     */
    @Query("SELECT udt.token FROM UserDeviceToken udt WHERE udt.isActive = true")
    List<String> findAllActiveTokens();

    /**
     * Obtiene tokens de usuarios específicos (para envío targeted)
     */
    @Query("SELECT udt.token FROM UserDeviceToken udt WHERE udt.user.id IN :userIds AND udt.isActive = true")
    List<String> findActiveTokensByUserIds(@Param("userIds") List<Long> userIds);

    /**
     * Encuentra un token específico por usuario y token
     */
    Optional<UserDeviceToken> findByUserIdAndToken(Long userId, String token);

    /**
     * Encuentra tokens de un usuario ordenados por fecha de creación (el más antiguo primero)
     */
    List<UserDeviceToken> findByUserIdOrderByCreatedAtAsc(Long userId);
}