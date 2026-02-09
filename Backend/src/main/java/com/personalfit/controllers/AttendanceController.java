package com.personalfit.controllers;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
import com.personalfit.models.Activity;
import com.personalfit.models.Attendance;
import com.personalfit.models.User;
import com.personalfit.services.AttendanceService;
import com.personalfit.services.UserService;

/**
 * Controller for Attendance Management.
 * Handles enrollment in classes and marking attendance (Manual or via NFC).
 */
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private UserService userService;

    /**
     * Enroll a user in an activity.
     */
    @PostMapping("/enroll/{userId}/{activityId}")
    public ResponseEntity<AttendanceDTO> enrollUser(@PathVariable Long userId, @PathVariable Long activityId) {
        AttendanceDTO attendance = attendanceService.enrollUser(userId, activityId);
        return ResponseEntity.ok(attendance);
    }

    /**
     * Unenroll a user from an activity.
     */
    @DeleteMapping("/unenroll/{userId}/{activityId}")
    public ResponseEntity<Map<String, Object>> unenrollUser(@PathVariable Long userId, @PathVariable Long activityId) {
        attendanceService.unenrollUser(userId, activityId);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User unenrolled successfully");
        response.put("success", true);
        response.put("userId", userId);
        response.put("activityId", activityId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get list of attendances for a specific activity (User IDs only).
     */
    @GetMapping("/activity/{activityId}")
    public ResponseEntity<List<AttendanceDTO>> getActivityAttendances(@PathVariable Long activityId) {
        List<AttendanceDTO> attendances = attendanceService.getActivityAttendances(activityId);
        return ResponseEntity.ok(attendances);
    }

    /**
     * Get enriched list of attendances for a specific activity (Includes User
     * Names).
     * Useful for trainers taking roll call.
     */
    @GetMapping("/activity/{activityId}/with-user-info")
    public ResponseEntity<List<AttendanceDTO>> getActivityAttendancesWithUserInfo(@PathVariable Long activityId) {
        List<AttendanceDTO> attendances = attendanceService.getActivityAttendancesWithUserInfo(activityId);
        return ResponseEntity.ok(attendances);
    }

    /**
     * Get a user's attendance history.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AttendanceDTO>> getUserAttendances(@PathVariable Long userId) {
        List<AttendanceDTO> attendances = attendanceService.getUserAttendances(userId);
        return ResponseEntity.ok(attendances);
    }

    /**
     * Manually update the status of an attendance record (e.g. Trainer marking
     * someone Present).
     */
    @PutMapping("/{attendanceId}/status")
    public ResponseEntity<Map<String, Object>> updateAttendanceStatus(
            @PathVariable Long attendanceId,
            @RequestBody Map<String, String> requestBody) {
        try {
            String statusString = requestBody.get("status");
            AttendanceStatus status = AttendanceStatus.valueOf(statusString.toUpperCase());

            attendanceService.updateAttendanceStatus(attendanceId, status);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Attendance status updated successfully");
            response.put("success", true);
            response.put("attendanceId", attendanceId);
            response.put("status", status);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Invalid attendance status");
            response.put("success", false);
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Error updating attendance: " + e.getMessage());
            response.put("success", false);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Check if a user is enrolled in an activity.
     */
    @GetMapping("/{activityId}/enrolled/{userId}")
    public ResponseEntity<Boolean> isUserEnrolled(@PathVariable Long activityId, @PathVariable Long userId) {
        boolean isEnrolled = attendanceService.isUserEnrolled(userId, activityId);
        return ResponseEntity.ok(isEnrolled);
    }

    @Autowired
    private com.personalfit.services.WorkShiftService workShiftService;

    /**
     * NFC Attendance Endpoint.
     * Logic:
     * 1. Receives DNI from NFC scan.
     * 2. Finds User.
     * 3. IF TRAINER -> User `WorkShiftService` to Check-in/Check-out.
     * 4. IF CLIENT -> Finds today's classes for that user.
     * 5. Determines the relevant class (current or upcoming).
     * 6. Applies Rules:
     * - Before Start or < 15 mins late -> PRESENT
     * - > 15 mins late -> LATE
     * - No relevant class found (ended) -> ABSENT (for the last class of day)
     */
    @PostMapping("/nfc/9551674a19bae81d4d27f5436470c9ee6ecd0b371088686f6afc58d6bf68df30")
    public ResponseEntity<Map<String, Object>> markAttendanceByNFC(@RequestBody Map<String, Integer> requestBody) {
        Map<String, Object> response = new HashMap<>();

        try {
            Integer dni = requestBody.get("dni");
            if (dni == null) {
                response.put("success", false);
                response.put("message", "DNI is required");
                return ResponseEntity.badRequest().body(response);
            }

            // TEST MODE BACKDOOR - TODO: REMOVE IN PRODUCTION
            if (dni.equals(123456)) {
                response.put("success", true);
                response.put("message", "Marked as PRESENT (TEST MODE)");
                response.put("status", "PRESENT");
                response.put("userName", "Test User");
                response.put("activityName", "Test Activity");
                response.put("activityTime", LocalDateTime.now().toString());
                return ResponseEntity.ok(response);
            }

            // 1. Find User by DNI
            User user;
            try {
                user = userService.getUserByDni(dni);
            } catch (Exception e) {
                response.put("success", false);
                response.put("message", "User with DNI " + dni + " not found");
                return ResponseEntity.notFound().build();
            }

            // --- TRAINER CHECK-IN / CHECK-OUT LOGIC ---
            if (user.getRole() == com.personalfit.enums.UserRole.TRAINER) {
                String action = workShiftService.processCheckInCheckOut(user);

                response.put("success", true);
                response.put("userName", user.getFullName());

                if ("CHECK_IN".equals(action)) {
                    response.put("message", "Trainer Check-In Successful");
                    response.put("status", "CHECK_IN");
                } else {
                    response.put("message", "Trainer Check-Out Successful");
                    response.put("status", "CHECK_OUT");
                }

                return ResponseEntity.ok(response);
            }
            // ------------------------------------------

            LocalDate today = LocalDate.now();
            LocalDateTime now = LocalDateTime.now();

            // 2. Get User's classes for today
            List<Attendance> todayAttendances = attendanceService.getUserAttendancesForDate(user.getId(), today);

            if (todayAttendances.isEmpty()) {
                response.put("success", false);
                response.put("message", "No classes scheduled for today for " + user.getFullName());
                return ResponseEntity.notFound().build();
            }

            // 3. Find relevant activity (current or upcoming)
            Attendance relevantAttendance = null;
            Activity relevantActivity = null;

            for (Attendance attendance : todayAttendances) {
                Activity activity = attendance.getActivity();
                LocalDateTime activityStart = activity.getDate();
                LocalDateTime activityEnd = activityStart.plusMinutes(activity.getDuration());

                // If activity is currently running or hasn't started yet
                if (now.isBefore(activityEnd)) {
                    relevantAttendance = attendance;
                    relevantActivity = activity;
                    break;
                }
            }

            // If no relevant activity found, it means all classes for today have ended.
            // Mark the LAST class as ABSENT if they are scanning now? (Logic seems to imply
            // they missed it).
            if (relevantAttendance == null) {
                Attendance lastAttendance = todayAttendances.get(todayAttendances.size() - 1);
                attendanceService.updateAttendanceStatus(lastAttendance.getId(), AttendanceStatus.ABSENT);

                response.put("success", true);
                response.put("message", "Class already ended. Marked as ABSENT");
                response.put("status", "ABSENT");
                response.put("userName", user.getFullName());
                response.put("activityName", lastAttendance.getActivity().getName());
                return ResponseEntity.ok(response);
            }

            // 4. Determine Status based on Time
            LocalDateTime activityStart = relevantActivity.getDate();
            LocalDateTime lateThreshold = activityStart.plusMinutes(15);
            AttendanceStatus newStatus;
            String statusMessage;

            if (now.isBefore(activityStart)) {
                // Class hasn't started yet -> Present
                newStatus = AttendanceStatus.PRESENT;
                statusMessage = "Marked as PRESENT (Class starting soon)";
            } else if (now.isBefore(lateThreshold)) {
                // < 15 mins late -> Present
                newStatus = AttendanceStatus.PRESENT;
                statusMessage = "Marked as PRESENT";
            } else {
                // > 15 mins late -> Late
                newStatus = AttendanceStatus.LATE;
                statusMessage = "Marked as LATE (> 15 mins delay)";
            }

            // 5. Update Status
            attendanceService.updateAttendanceStatus(relevantAttendance.getId(), newStatus);

            response.put("success", true);
            response.put("message", statusMessage);
            response.put("status", newStatus.toString());
            response.put("userName", user.getFullName());
            response.put("activityName", relevantActivity.getName());
            response.put("activityTime", relevantActivity.getDate().toString());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error processing NFC attendance: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
