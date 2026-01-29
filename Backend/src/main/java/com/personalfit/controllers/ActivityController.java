package com.personalfit.controllers;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.dto.Activity.ActivityDetailInfoDTO;
import com.personalfit.dto.Activity.ActivityFormTypeDTO;
import com.personalfit.dto.Activity.ActivityTypeDTO;
import com.personalfit.dto.Attendance.EnrollmentRequestDTO;
import com.personalfit.dto.Attendance.EnrollmentResponseDTO;
import com.personalfit.services.ActivityService;

import jakarta.transaction.Transactional;

/**
 * API Controller for Activity Management.
 * Endpoints for creating, updating, retrieving, and enrolling in gym
 * activities.
 */
@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    /**
     * Create a new activity/class.
     */
    @PostMapping("/new")
    public ResponseEntity<Map<String, Object>> newActivity(@RequestBody ActivityFormTypeDTO activity) {
        activityService.createActivity(activity);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Activity created successfully");
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    /**
     * Update an existing activity.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateActivity(@PathVariable Long id,
            @RequestBody ActivityFormTypeDTO activity) {
        activityService.updateActivity(id, activity);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Activity updated successfully");
        response.put("success", true);
        response.put("activityId", id);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete an activity.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteActivity(@PathVariable Long id) {
        activityService.deleteActivity(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Activity deleted successfully");
        response.put("success", true);
        response.put("activityId", id);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all activities.
     */
    @GetMapping("/getAll")
    public ResponseEntity<List<ActivityTypeDTO>> getAllActivities() {
        List<ActivityTypeDTO> activities = activityService.getAllActivitiesTypeDto();
        return ResponseEntity.ok(activities);
    }

    /**
     * Get Activities for a specific week.
     * 
     * @param date Any date within the requested week (ISO format YYYY-MM-DD).
     */
    @GetMapping("/getAllByWeek/{date}")
    public ResponseEntity<List<ActivityTypeDTO>> getAllActivitiesAtWeek(
            @PathVariable("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<ActivityTypeDTO> activities = activityService.getAllActivitiesTypeDtoAtWeek(date);
        return ResponseEntity.ok(activities);
    }

    /**
     * Get detailed info for a specific activity (incl. participants).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ActivityDetailInfoDTO> getActivityInfo(@PathVariable Long id) {
        ActivityDetailInfoDTO activityInfo = activityService.getActivityDetailInfo(id);
        return ResponseEntity.ok(activityInfo);
    }

    // ==================
    // Enrollment Endpoints
    // ==================

    /**
     * Enroll a user in a class.
     */
    @PostMapping("/enroll")
    public ResponseEntity<EnrollmentResponseDTO> enrollUser(@RequestBody EnrollmentRequestDTO enrollmentRequest) {
        EnrollmentResponseDTO response = activityService.enrollUser(enrollmentRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Unenroll a user from a class.
     */
    @PostMapping("/unenroll")
    public ResponseEntity<EnrollmentResponseDTO> unenrollUser(@RequestBody EnrollmentRequestDTO enrollmentRequest) {
        EnrollmentResponseDTO response = activityService.unenrollUser(enrollmentRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Check if a user is enrolled in a class.
     */
    @GetMapping("/{activityId}/enrolled/{userId}")
    public ResponseEntity<Boolean> isUserEnrolled(@PathVariable Long activityId, @PathVariable Long userId) {
        boolean isEnrolled = activityService.isUserEnrolled(userId, activityId);
        return ResponseEntity.ok(isEnrolled);
    }

    /**
     * Batch create activities.
     */
    @Transactional
    @PostMapping("/batch")
    public ResponseEntity<Map<String, Object>> createBatchActivities(
            @RequestBody List<ActivityFormTypeDTO> activities) {
        Integer createdCount = activityService.createBatchActivities(activities);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Activities batch created successfully");
        response.put("success", true);
        response.put("createdCount", createdCount);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

}
