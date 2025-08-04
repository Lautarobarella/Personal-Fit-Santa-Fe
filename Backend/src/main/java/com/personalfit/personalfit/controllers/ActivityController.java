package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.dto.ActivityDetailInfoDTO;
import com.personalfit.personalfit.dto.ActivityFormTypeDTO;
import com.personalfit.personalfit.dto.ActivityTypeDTO;
import com.personalfit.personalfit.dto.EnrollmentRequestDTO;
import com.personalfit.personalfit.dto.EnrollmentResponseDTO;
import com.personalfit.personalfit.services.IActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    @Autowired
    private IActivityService activityService;

    @PostMapping("/new")
    public ResponseEntity<Void> newActivity(@RequestBody ActivityFormTypeDTO activity) {
        activityService.createActivity(activity);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Void> updateActivity(@PathVariable Long id, @RequestBody ActivityFormTypeDTO activity) {
        activityService.updateActivity(id, activity);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActivity(@PathVariable Long id) {
        activityService.deleteActivity(id);
        return ResponseEntity.ok().build();
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

    @GetMapping("/info/{id}")
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
