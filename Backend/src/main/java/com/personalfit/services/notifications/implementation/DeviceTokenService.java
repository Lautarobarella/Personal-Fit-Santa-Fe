package com.personalfit.services.notifications.implementation;

import com.personalfit.dto.Notification.RegisterDeviceTokenRequest;
import com.personalfit.enums.DeviceType;
import com.personalfit.models.User;
import com.personalfit.models.UserDeviceToken;
import com.personalfit.repository.UserDeviceTokenRepository;
import com.personalfit.repository.UserRepository;
import com.personalfit.services.notifications.interfaces.IDeviceTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Implementación del servicio de gestión de tokens de dispositivos
 * Responsable únicamente de la gestión de tokens FCM
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceTokenService implements IDeviceTokenService {

    private final UserDeviceTokenRepository deviceTokenRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public boolean registerDeviceToken(RegisterDeviceTokenRequest request) {
        try {
            Optional<User> userOpt = userRepository.findById(request.getUserId());
            if (userOpt.isEmpty()) {
                log.warn("User not found with ID: {}", request.getUserId());
                return false;
            }

            User user = userOpt.get();

            // Verificar si el token ya existe
            Optional<UserDeviceToken> existingToken = deviceTokenRepository.findByToken(request.getToken());
            if (existingToken.isPresent()) {
                // Actualizar el token existente
                UserDeviceToken token = existingToken.get();
                token.setUser(user);
                token.setDeviceType(request.getDeviceType());
                token.setDeviceInfo(request.getDeviceInfo());
                token.setIsActive(true);
                deviceTokenRepository.save(token);
                log.debug("Updated existing device token for user: {} | Token: {}...",
                        user.getId(), request.getToken().substring(0, 20));
            } else {
                // Limpiar tokens antiguos del mismo usuario si hay demasiados (mantener solo los 2 más recientes)
                List<UserDeviceToken> userTokens = deviceTokenRepository.findByUserIdOrderByCreatedAtAsc(user.getId());
                if (userTokens.size() >= 2) {
                    // Eliminar los tokens más antiguos, manteniendo solo el más reciente
                    for (int i = 0; i < userTokens.size() - 1; i++) {
                        UserDeviceToken oldToken = userTokens.get(i);
                        deviceTokenRepository.delete(oldToken);
                        log.debug("Cleaned up old token for user: {} | Token: {}...",
                                user.getId(), oldToken.getToken().substring(0, 20));
                    }
                }

                // Crear nuevo token
                UserDeviceToken newToken = UserDeviceToken.builder()
                        .user(user)
                        .token(request.getToken())
                        .deviceType(request.getDeviceType())
                        .deviceInfo(request.getDeviceInfo())
                        .isActive(true)
                        .build();
                deviceTokenRepository.save(newToken);
                log.debug("Registered new device token for user: {} | Token: {}...",
                        user.getId(), request.getToken().substring(0, 20));
            }

            // Verificar que el token se guardó correctamente
            long totalTokensForUser = deviceTokenRepository.countByUserIdAndIsActiveTrue(user.getId());
            log.debug("User {} now has {} active device tokens", user.getId(), totalTokensForUser);

            return true;
        } catch (Exception e) {
            log.error("Error registering device token for user {}: {}", request.getUserId(), e.getMessage(), e);
            return false;
        }
    }

    @Override
    public boolean registerDeviceToken(Long userId, String token, String deviceInfo) {
        RegisterDeviceTokenRequest request = RegisterDeviceTokenRequest.builder()
                .userId(userId)
                .token(token)
                .deviceType(DeviceType.PWA)
                .deviceInfo(deviceInfo)
                .build();
        return registerDeviceToken(request);
    }

    @Override
    @Transactional
    public boolean unregisterDeviceToken(String token) {
        try {
            Optional<UserDeviceToken> tokenOpt = deviceTokenRepository.findByToken(token);
            if (tokenOpt.isPresent()) {
                deviceTokenRepository.delete(tokenOpt.get());
                log.debug("Unregistered device token: {}...", token.substring(0, 10));
                return true;
            }
            log.warn("Device token not found: {}...", token.substring(0, 10));
            return false;
        } catch (Exception e) {
            log.error("Error unregistering device token: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional
    public boolean unregisterDeviceToken(Long userId, String token) {
        try {
            Optional<UserDeviceToken> tokenOpt = deviceTokenRepository.findByUserIdAndToken(userId, token);
            if (tokenOpt.isPresent()) {
                deviceTokenRepository.delete(tokenOpt.get());
                log.debug("Unregistered device token for user: {} token: {}...", userId, token.substring(0, 10));
                return true;
            }
            log.warn("Device token not found for user: {} token: {}...", userId, token.substring(0, 10));
            return false;
        } catch (Exception e) {
            log.error("Error unregistering device token for user {}: {}", userId, e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional
    public boolean deactivateAllUserTokens(Long userId) {
        try {
            List<UserDeviceToken> userTokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(userId);
            if (userTokens.isEmpty()) {
                log.debug("User {} has no active tokens to deactivate", userId);
                return true;
            }

            deviceTokenRepository.deactivateAllByUserId(userId);
            log.info("User {} unsubscribed from push notifications - {} tokens deactivated",
                    userId, userTokens.size());
            return true;

        } catch (Exception e) {
            log.error("Error deactivating all tokens for user {}: {}", userId, e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional
    public boolean deactivateTokenOnLogout(String userEmail, String deviceToken) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(userEmail);
            if (userOpt.isEmpty()) {
                log.warn("User not found for email: {} during token deactivation", userEmail);
                return false;
            }

            Long userId = userOpt.get().getId();
            Optional<UserDeviceToken> tokenOpt = deviceTokenRepository.findByUserIdAndToken(userId, deviceToken);

            if (tokenOpt.isPresent()) {
                deviceTokenRepository.deactivateByToken(deviceToken);
                log.debug("Device token deactivated on logout for user: {} (ID: {})", userEmail, userId);
                return true;
            } else {
                log.debug("Token not found for user: {} during logout", userEmail);
                return false;
            }
        } catch (Exception e) {
            log.error("Error deactivating device token on logout for user {}: {}", userEmail, e.getMessage(), e);
            return false;
        }
    }

    @Override
    public long getActiveTokenCount(Long userId) {
        try {
            return deviceTokenRepository.countByUserIdAndIsActiveTrue(userId);
        } catch (Exception e) {
            log.error("Error getting active token count for user {}: {}", userId, e.getMessage(), e);
            return 0;
        }
    }

    @Override
    public boolean hasActiveTokens(Long userId) {
        try {
            return getActiveTokenCount(userId) > 0;
        } catch (Exception e) {
            log.error("Error checking if user {} has active tokens: {}", userId, e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Scheduled(fixedRate = 3600000) // Cada hora
    @Transactional
    public void cleanupInvalidTokens() {
        try {
            // Obtener tokens que no han sido usados en los últimos 30 días
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
            List<UserDeviceToken> inactiveTokens = deviceTokenRepository.findInactiveTokens(cutoffDate);

            for (UserDeviceToken token : inactiveTokens) {
                deviceTokenRepository.deactivateByToken(token.getToken());
            }

            if (!inactiveTokens.isEmpty()) {
                log.info("Token cleanup: Deactivated {} inactive tokens older than 30 days",
                        inactiveTokens.size());
            }
        } catch (Exception e) {
            log.error("Error cleaning up invalid tokens: {}", e.getMessage(), e);
        }
    }
}