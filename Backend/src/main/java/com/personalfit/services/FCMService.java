package com.personalfit.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.Notification;
import com.personalfit.models.UserTokens;
import com.personalfit.repository.UserTokensRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * Service for handling Firebase Cloud Messaging (FCM) operations.
 * Manages token registration and sending push notifications.
 */
@Service
@Slf4j
public class FCMService {

    @Autowired
    private UserTokensRepository userTokensRepository;

    /**
     * Registers a new FCM token for a user.
     * Adds the token to the user's existing list if it exists, otherwise creates a
     * new record.
     */
    public void registerToken(Long userId, String token) {
        Optional<UserTokens> userTokensOpt = userTokensRepository.findByUserId(userId);
        UserTokens userTokens;
        if (userTokensOpt.isPresent()) {
            userTokens = userTokensOpt.get();
        } else {
            userTokens = UserTokens.builder()
                    .userId(userId)
                    .build();
        }
        userTokens.addToken(token);
        userTokensRepository.save(userTokens);
        // Never log the token itself; user id is enough for diagnostics.
        log.debug("FCM token registered: userId={}", userId);
    }

    /**
     * Unregisters an FCM token for a user.
     */
    public void unregisterToken(Long userId, String token) {
        Optional<UserTokens> userTokensOpt = userTokensRepository.findByUserId(userId);
        if (userTokensOpt.isPresent()) {
            UserTokens userTokens = userTokensOpt.get();
            userTokens.removeToken(token);
            userTokensRepository.save(userTokens);
            log.debug("FCM token unregistered: userId={}", userId);
        }
    }

    /**
     * Sends a push notification to a specific user.
     * 
     * @param userId The ID of the recipient user.
     * @param title  The title of the notification.
     * @param body   The body content of the notification.
     */
    public void sendNotification(Long userId, String title, String body) {
        // Check if Firebase is initialized
        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("Firebase not initialized; skipping push to userId={}", userId);
            return;
        }

        Optional<UserTokens> userTokensOpt = userTokensRepository.findByUserId(userId);
        if (userTokensOpt.isPresent() && !userTokensOpt.get().getTokens().isEmpty()) {
            List<String> tokens = userTokensOpt.get().getTokens();

            log.debug("Sending push to userId={} with {} token(s)", userId, tokens.size());

            // Send to multiple tokens (Multicast)
            MulticastMessage message = MulticastMessage.builder()
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .addAllTokens(tokens)
                    .build();

            try {
                BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
                log.debug("Push sent: userId={}, success={}, failure={}", userId,
                        response.getSuccessCount(), response.getFailureCount());

                if (response.getFailureCount() > 0) {
                    // Aggregate, don't dump per-token response objects (verbose).
                    log.warn("Push partial failure: userId={}, failures={}", userId, response.getFailureCount());
                }
            } catch (Exception e) {
                log.error("Push send error: userId={}, cause={}", userId, e.getMessage());
            }
        } else {
            log.debug("No FCM tokens for userId={}; push skipped", userId);
        }
    }

    /**
     * Sends a push notification to a list of users.
     * Currently iterates through the list to send individual notifications.
     */
    public void sendBulkNotification(List<Long> userIds, String title, String body) {
        // This is a simplified approach. For true bulk, we might want to collect all
        // tokens first.
        // Or iterate. Given the structure, iterating is safer to avoid token limits per
        // message if list is huge.
        // But for efficiency, we should batch.
        // For now, let's iterate to reuse sendNotification logic or build a larger
        // list.

        // Better approach: Find all tokens for these users.
        // However, JPA doesn't easily support "findAllTokensByUserIds".
        // Let's iterate for now as it's safer and simpler.
        // Implementation note: Ideally, this should collect all tokens and send in a
        // single batch
        // if supported and efficient. For now, iteration is used to reuse existing
        // logic.
        for (Long userId : userIds) {
            sendNotification(userId, title, body);
        }
    }
}
