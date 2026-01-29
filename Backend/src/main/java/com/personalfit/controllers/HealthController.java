package com.personalfit.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Health Check Controller.
 * Used by monitoring tools or load balancers to verify system availability.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    /**
     * Basic Health Check Endpoint.
     * Returns 200 OK if the application is running.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> healthStatus = new HashMap<>();

        healthStatus.put("status", "healthy");
        healthStatus.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        healthStatus.put("service", "PersonalFit Backend");
        healthStatus.put("version", "1.0.0");
        healthStatus.put("uptime", System.currentTimeMillis());

        return ResponseEntity.ok(healthStatus);
    }
}
