package com.personalfit.controllers;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.models.User;
import com.personalfit.repository.UserRepository;
import com.personalfit.services.FCMService;

/**
 * Controller for Firebase Cloud Messaging (FCM).
 * Handles handling device tokens for push notifications.
 */
@RestController
@RequestMapping("/api/fcm")
public class FCMController {

    @Autowired
    private FCMService fcmService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Register a new FCM device token for the current user.
     */
    @PostMapping("/register")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> registerToken(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        Long userId = getCurrentUserId();

        fcmService.registerToken(userId, token);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Token registered successfully");
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    /**
     * Unregister/Remove an FCM device token.
     */
    @PostMapping("/unregister")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> unregisterToken(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        Long userId = getCurrentUserId();

        fcmService.unregisterToken(userId, token);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Token removed successfully");
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    /**
     * Helper to get current authenticated user ID.
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}
