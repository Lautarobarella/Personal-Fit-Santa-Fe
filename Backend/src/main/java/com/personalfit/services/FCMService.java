package com.personalfit.services;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.google.firebase.ErrorCode;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.BatchResponse;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.MulticastMessage;
import com.google.firebase.messaging.Notification;
import com.google.firebase.messaging.SendResponse;
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

    private static final int FCM_MULTICAST_LIMIT = 500;

    @Autowired
    private UserTokensRepository userTokensRepository;

    /**
     * Registers a new FCM token for a user.
     * Adds the token to the user's existing list if it exists, otherwise creates a
     * new record.
     */
    public void registerToken(Long userId, String token) {
        if (token == null || token.isBlank()) {
            log.warn("Ignoring empty FCM token registration: userId={}", userId);
            return;
        }

        Optional<UserTokens> userTokensOpt = userTokensRepository.findByUserId(userId);
        UserTokens userTokens;
        if (userTokensOpt.isPresent()) {
            userTokens = userTokensOpt.get();
        } else {
            userTokens = UserTokens.builder()
                    .userId(userId)
                    .build();
        }
        userTokens.addToken(token.trim());
        userTokensRepository.save(userTokens);
        log.info("FCM token registered: userId={}, totalTokens={}", userId, userTokens.getTokens().size());
    }

    /**
     * Unregisters an FCM token for a user.
     */
    public void unregisterToken(Long userId, String token) {
        if (token == null || token.isBlank()) {
            log.warn("Ignoring empty FCM token unregister: userId={}", userId);
            return;
        }

        Optional<UserTokens> userTokensOpt = userTokensRepository.findByUserId(userId);
        if (userTokensOpt.isPresent()) {
            UserTokens userTokens = userTokensOpt.get();
            userTokens.removeToken(token.trim());
            userTokensRepository.save(userTokens);
            log.info("FCM token unregistered: userId={}, remainingTokens={}", userId, userTokens.getTokens().size());
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
            UserTokens userTokens = userTokensOpt.get();
            List<String> originalTokens = userTokens.getTokens();
            List<String> tokens = originalTokens.stream()
                    .filter(token -> token != null && !token.isBlank())
                    .distinct()
                    .toList();
            Set<String> tokensToRemove = new LinkedHashSet<>();

            if (tokens.size() != originalTokens.size()) {
                originalTokens.stream()
                        .filter(token -> token == null || token.isBlank())
                        .forEach(tokensToRemove::add);
            }

            if (tokens.isEmpty()) {
                cleanInvalidTokens(userTokens, tokensToRemove);
                log.debug("No valid FCM tokens for userId={}; push skipped", userId);
                return;
            }

            log.debug("Sending push to userId={} with {} token(s)", userId, tokens.size());

            int successCount = 0;
            int failureCount = 0;

            for (int start = 0; start < tokens.size(); start += FCM_MULTICAST_LIMIT) {
                List<String> tokenBatch = tokens.subList(start, Math.min(start + FCM_MULTICAST_LIMIT, tokens.size()));

                try {
                    BatchResponse response = FirebaseMessaging.getInstance()
                            .sendEachForMulticast(buildMessage(title, body, tokenBatch));

                    successCount += response.getSuccessCount();
                    failureCount += response.getFailureCount();
                    collectFailedTokens(userId, tokenBatch, response, tokensToRemove, start);
                } catch (FirebaseMessagingException e) {
                    failureCount += tokenBatch.size();
                    log.error("Push batch error: userId={}, batchSize={}, messagingError={}, errorCode={}, cause={}",
                            userId,
                            tokenBatch.size(),
                            e.getMessagingErrorCode(),
                            e.getErrorCode(),
                            e.getMessage());
                } catch (Exception e) {
                    failureCount += tokenBatch.size();
                    log.error("Push batch error: userId={}, batchSize={}, cause={}", userId, tokenBatch.size(),
                            e.getMessage());
                }
            }

            cleanInvalidTokens(userTokens, tokensToRemove);

            log.info("Push delivery finished: userId={}, tokenCount={}, success={}, failure={}",
                    userId, tokens.size(), successCount, failureCount);
        } else {
            log.debug("No FCM tokens for userId={}; push skipped", userId);
        }
    }

    /**
     * Sends a push notification to a list of users.
     * Currently iterates through the list to send individual notifications.
     */
    @Async
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
        log.info("Bulk push dispatched: recipients={}", userIds.size());
    }

    private MulticastMessage buildMessage(String title, String body, List<String> tokens) {
        return MulticastMessage.builder()
                .setNotification(Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build())
                .addAllTokens(tokens)
                .build();
    }

    private void collectFailedTokens(Long userId, List<String> tokenBatch, BatchResponse response,
            Set<String> tokensToRemove, int batchStartIndex) {
        List<SendResponse> responses = response.getResponses();

        for (int index = 0; index < responses.size(); index++) {
            SendResponse sendResponse = responses.get(index);
            if (sendResponse.isSuccessful()) {
                continue;
            }

            FirebaseMessagingException exception = sendResponse.getException();
            MessagingErrorCode messagingErrorCode = exception != null ? exception.getMessagingErrorCode() : null;
            ErrorCode errorCode = exception != null ? exception.getErrorCode() : null;

            if (shouldRemoveToken(messagingErrorCode, errorCode)) {
                tokensToRemove.add(tokenBatch.get(index));
            }

            log.warn("Push token failed: userId={}, tokenIndex={}, messagingError={}, errorCode={}, cause={}",
                    userId,
                    batchStartIndex + index,
                    messagingErrorCode,
                    errorCode,
                    exception != null ? exception.getMessage() : "unknown");
        }
    }

    private boolean shouldRemoveToken(MessagingErrorCode messagingErrorCode, ErrorCode errorCode) {
        return messagingErrorCode == MessagingErrorCode.UNREGISTERED
                || messagingErrorCode == MessagingErrorCode.INVALID_ARGUMENT
                || messagingErrorCode == MessagingErrorCode.SENDER_ID_MISMATCH
                || errorCode == ErrorCode.INVALID_ARGUMENT;
    }

    private void cleanInvalidTokens(UserTokens userTokens, Set<String> tokensToRemove) {
        if (tokensToRemove.isEmpty()) {
            return;
        }

        List<String> currentTokens = new ArrayList<>(userTokens.getTokens());
        currentTokens.removeIf(token -> token == null || token.isBlank() || tokensToRemove.contains(token));
        userTokens.setTokens(currentTokens);
        userTokensRepository.save(userTokens);
        log.info("Cleaned invalid FCM tokens: userId={}, removed={}, remaining={}",
                userTokens.getUserId(), tokensToRemove.size(), currentTokens.size());
    }
}
