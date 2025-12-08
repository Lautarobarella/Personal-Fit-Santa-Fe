package com.personalfit.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.Notification;
import com.personalfit.models.UserTokens;
import com.personalfit.repository.UserTokensRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class FCMService {

    @Autowired
    private UserTokensRepository userTokensRepository;

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
        log.info("✅ FCM Token registered for user: {}", userId);
    }

    public void unregisterToken(Long userId, String token) {
        Optional<UserTokens> userTokensOpt = userTokensRepository.findByUserId(userId);
        if (userTokensOpt.isPresent()) {
            UserTokens userTokens = userTokensOpt.get();
            userTokens.removeToken(token);
            userTokensRepository.save(userTokens);
            log.info("✅ FCM Token unregistered for user: {}", userId);
        }
    }

    public void sendNotification(Long userId, String title, String body) {
        Optional<UserTokens> userTokensOpt = userTokensRepository.findByUserId(userId);
        if (userTokensOpt.isPresent() && !userTokensOpt.get().getTokens().isEmpty()) {
            List<String> tokens = userTokensOpt.get().getTokens();

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
                log.info("✅ FCM Notification sent to user: {}. Success: {}, Failure: {}", userId,
                        response.getSuccessCount(), response.getFailureCount());
            } catch (Exception e) {
                log.error("❌ Error sending FCM notification to user {}: {}", userId, e.getMessage());
            }
        }
    }

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
        for (Long userId : userIds) {
            sendNotification(userId, title, body);
        }
    }
}
