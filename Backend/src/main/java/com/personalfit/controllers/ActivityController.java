package com.personalfit.controllers;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
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

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    @PostMapping("/new")
    public ResponseEntity<Map<String, Object>> newActivity(@RequestBody ActivityFormTypeDTO activity) {
        activityService.createActivity(activity);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Actividad creada exitosamente");
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateActivity(@PathVariable Long id, @RequestBody ActivityFormTypeDTO activity) {
        activityService.updateActivity(id, activity);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Actividad actualizada exitosamente");
        response.put("success", true);
        response.put("activityId", id);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteActivity(@PathVariable Long id) {
        activityService.deleteActivity(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Actividad eliminada exitosamente");
        response.put("success", true);
        response.put("activityId", id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<ActivityTypeDTO>> getAllActivities() {
        List<ActivityTypeDTO> activities = activityService.getAllActivitiesTypeDto();
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/getAllByWeek/{date}")
    public ResponseEntity<List<ActivityTypeDTO>> getAllActivitiesAtWeek(@PathVariable("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<ActivityTypeDTO> activities = activityService.getAllActivitiesTypeDtoAtWeek(date);
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivityDetailInfoDTO> getActivityInfo(@PathVariable Long id) {
        ActivityDetailInfoDTO activityInfo = activityService.getActivityDetailInfo(id);
        return ResponseEntity.ok(activityInfo);
    }
    
    // Enrollment endpoints
    @PostMapping("/enroll")
    public ResponseEntity<EnrollmentResponseDTO> enrollUser(@RequestBody EnrollmentRequestDTO enrollmentRequest) {
        EnrollmentResponseDTO response = activityService.enrollUser(enrollmentRequest);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/unenroll")
    public ResponseEntity<EnrollmentResponseDTO> unenrollUser(@RequestBody EnrollmentRequestDTO enrollmentRequest) {
        EnrollmentResponseDTO response = activityService.unenrollUser(enrollmentRequest);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{activityId}/enrolled/{userId}")
    public ResponseEntity<Boolean> isUserEnrolled(@PathVariable Long activityId, @PathVariable Long userId) {
        boolean isEnrolled = activityService.isUserEnrolled(userId, activityId);
        return ResponseEntity.ok(isEnrolled);
    }

}
