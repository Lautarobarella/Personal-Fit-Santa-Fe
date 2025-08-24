package com.personalfit.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.dto.Attendance.AttendanceDTO;
import com.personalfit.enums.AttendanceStatus;
import com.personalfit.services.AttendanceService;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;
    
    @PostMapping("/enroll/{userId}/{activityId}")
    public ResponseEntity<AttendanceDTO> enrollUser(@PathVariable Long userId, @PathVariable Long activityId) {
        AttendanceDTO attendance = attendanceService.enrollUser(userId, activityId);
        return ResponseEntity.ok(attendance);
    }
    
    @DeleteMapping("/unenroll/{userId}/{activityId}")
    public ResponseEntity<Map<String, Object>> unenrollUser(@PathVariable Long userId, @PathVariable Long activityId) {
        attendanceService.unenrollUser(userId, activityId);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Usuario desinscrito exitosamente");
        response.put("success", true);
        response.put("userId", userId);
        response.put("activityId", activityId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/activity/{activityId}")
    public ResponseEntity<List<AttendanceDTO>> getActivityAttendances(@PathVariable Long activityId) {
        List<AttendanceDTO> attendances = attendanceService.getActivityAttendances(activityId);
        return ResponseEntity.ok(attendances);
    }
    
    @GetMapping("/activity/{activityId}/with-user-info")
    public ResponseEntity<List<AttendanceDTO>> getActivityAttendancesWithUserInfo(@PathVariable Long activityId) {
        List<AttendanceDTO> attendances = attendanceService.getActivityAttendancesWithUserInfo(activityId);
        return ResponseEntity.ok(attendances);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AttendanceDTO>> getUserAttendances(@PathVariable Long userId) {
        List<AttendanceDTO> attendances = attendanceService.getUserAttendances(userId);
        return ResponseEntity.ok(attendances);
    }
    
    @PutMapping("/{attendanceId}/status")
    public ResponseEntity<Map<String, Object>> updateAttendanceStatus(
            @PathVariable Long attendanceId, 
            @RequestBody Map<String, String> requestBody) {
        try {
            String statusString = requestBody.get("status");
            AttendanceStatus status = AttendanceStatus.valueOf(statusString.toUpperCase());
            
            attendanceService.updateAttendanceStatus(attendanceId, status);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Estado de asistencia actualizado exitosamente");
            response.put("success", true);
            response.put("attendanceId", attendanceId);
            response.put("status", status);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Estado de asistencia inválido");
            response.put("success", false);
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Error al actualizar la asistencia: " + e.getMessage());
            response.put("success", false);
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @GetMapping("/{activityId}/enrolled/{userId}")
    public ResponseEntity<Boolean> isUserEnrolled(@PathVariable Long activityId, @PathVariable Long userId) {
        boolean isEnrolled = attendanceService.isUserEnrolled(userId, activityId);
        return ResponseEntity.ok(isEnrolled);
    }
}
