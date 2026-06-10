package com.personalfit.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

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

        String trimmedToken = token.trim();

        UserTokens userTokens = userTokensRepository.findByUserId(userId)
                .orElseGet(() -> UserTokens.builder().userId(userId).build());

        int previousCount = userTokens.getTokens() != null ? userTokens.getTokens().size() : 0;

        // Single-token-per-user policy.
        // Each user keeps ONLY their most recently registered device token.
        // Rationale: the same physical device kept registering new tokens over
        // time (FCM token rotation / service-worker re-subscription), leaving
        // several *valid* tokens that all pointed to the same device. FCM then
        // delivered the push once per token, so users saw the SAME notification
        // duplicated. Replacing the list with a single token guarantees exactly
        // one delivery per user.
        userTokens.setTokens(new ArrayList<>(List.of(trimmedToken)));
        userTokensRepository.save(userTokens);

        log.info("FCM token registered (single-token policy): userId={}, previousTokens={}, now=1",
                userId, previousCount);
    }

    /**
     * Diagnostic helper: returns the FCM tokens currently stored for a user.
     */
    public List<String> getTokens(Long userId) {
        return userTokensRepository.findByUserId(userId)
                .map(UserTokens::getTokens)
                .orElseGet(ArrayList::new);
    }

    /**
     * One-shot maintenance: enforce the single-token-per-user policy on the
     * EXISTING data. For every user with more than one (or blank/duplicate)
     * token, keep only the most recently registered token and drop the rest.
     *
     * This clears the "inherited" duplicate push deliveries that pre-date the
     * single-token policy, without waiting for each user to re-open the app.
     *
     * @return summary with usersScanned, usersAffected and tokensRemoved.
     */
    public Map<String, Object> purgeDuplicateTokens() {
        List<UserTokens> all = userTokensRepository.findAll();
        int usersAffected = 0;
        int tokensRemoved = 0;

        for (UserTokens userTokens : all) {
            List<String> current = userTokens.getTokens();
            if (current == null || current.isEmpty()) {
                continue;
            }

            // De-duplicate and drop blanks, preserving registration order.
            List<String> cleaned = current.stream()
                    .filter(token -> token != null && !token.isBlank())
                    .distinct()
                    .collect(Collectors.toList());

            // Nothing to do: already a single valid token.
            if (cleaned.size() == current.size() && cleaned.size() <= 1) {
                continue;
            }

            int before = current.size();
            // Keep the LAST token = the most recently registered device.
            List<String> kept = cleaned.isEmpty()
                    ? new ArrayList<>()
                    : new ArrayList<>(List.of(cleaned.get(cleaned.size() - 1)));

            userTokens.setTokens(kept);
            userTokensRepository.save(userTokens);

            usersAffected++;
            tokensRemoved += (before - kept.size());
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("usersScanned", all.size());
        summary.put("usersAffected", usersAffected);
        summary.put("tokensRemoved", tokensRemoved);

        log.info("FCM token purge complete | usersScanned={}, usersAffected={}, tokensRemoved={}",
                all.size(), usersAffected, tokensRemoved);

        return summary;
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
        log.debug("sendNotification START | userId={}", userId);

        // Check if Firebase is initialized
        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("sendNotification | Firebase not initialized; skipping push to userId={}", userId);
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
     * Async variant of {@link #sendNotification(Long, String, String)} for a
     * single recipient. Runs on the async executor — the exact same delivery
     * context as {@link #sendBulkNotification(List, String, String)}, which is
     * the path verified to deliver pushes reliably — so scheduled jobs and
     * request threads never block on FCM network I/O and a slow or failing
     * push cannot stall the (single-threaded) Spring scheduler.
     *
     * NOTE: must be invoked from another bean (proxied call) for @Async to
     * apply; all current callers live in NotificationService / tasks.
     */
    @Async
    public void sendNotificationAsync(Long userId, String title, String body) {
        sendNotification(userId, title, body);
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
        // DATA-ONLY message (no `notification` block) on purpose.
        //
        // On web push, when the payload contains a `notification` block the
        // browser/FCM SDK displays it AUTOMATICALLY, and our service worker's
        // onBackgroundMessage ALSO calls showNotification() -> the user saw the
        // SAME notification twice. Sending data-only means the browser does not
        // auto-display anything; the service worker shows it exactly once,
        // reading title/body from `data`.
        return MulticastMessage.builder()
                .putData("title", title != null ? title : "")
                .putData("body", body != null ? body : "")
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

            // Per-token failures are expected (stale/uninstalled devices) and very
            // noisy in bulk sends. Keep them at DEBUG; the aggregated success/failure
            // summary is logged once at INFO in sendNotification().
            log.debug("Push token failed: userId={}, tokenIndex={}, messagingError={}, errorCode={}, cause={}",
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
