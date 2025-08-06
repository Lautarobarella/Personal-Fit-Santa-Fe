package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.dto.AttendanceDTO;
import com.personalfit.personalfit.services.IAttendanceService;
import com.personalfit.personalfit.utils.AttendanceStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private IAttendanceService attendanceService;
    
    @PostMapping("/enroll/{userId}/{activityId}")
    public ResponseEntity<AttendanceDTO> enrollUser(@PathVariable Long userId, @PathVariable Long activityId) {
        AttendanceDTO attendance = attendanceService.enrollUser(userId, activityId);
        return ResponseEntity.ok(attendance);
    }
    
    @DeleteMapping("/unenroll/{userId}/{activityId}")
    public ResponseEntity<Void> unenrollUser(@PathVariable Long userId, @PathVariable Long activityId) {
        attendanceService.unenrollUser(userId, activityId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/activity/{activityId}")
    public ResponseEntity<List<AttendanceDTO>> getActivityAttendances(@PathVariable Long activityId) {
        List<AttendanceDTO> attendances = attendanceService.getActivityAttendances(activityId);
        return ResponseEntity.ok(attendances);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AttendanceDTO>> getUserAttendances(@PathVariable Long userId) {
        List<AttendanceDTO> attendances = attendanceService.getUserAttendances(userId);
        return ResponseEntity.ok(attendances);
    }
    
    @PutMapping("/{attendanceId}/status")
    public ResponseEntity<Void> updateAttendanceStatus(
            @PathVariable Long attendanceId, 
            @RequestParam AttendanceStatus status) {
        attendanceService.updateAttendanceStatus(attendanceId, status);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/{activityId}/enrolled/{userId}")
    public ResponseEntity<Boolean> isUserEnrolled(@PathVariable Long activityId, @PathVariable Long userId) {
        boolean isEnrolled = attendanceService.isUserEnrolled(userId, activityId);
        return ResponseEntity.ok(isEnrolled);
    }
}
