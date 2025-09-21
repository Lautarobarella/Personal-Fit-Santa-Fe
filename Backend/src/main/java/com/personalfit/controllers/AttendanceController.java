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

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;
    
    @Autowired
    private UserService userService;
    
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
    
    @PostMapping("/nfc/9551674a19bae81d4d27f5436470c9ee6ecd0b371088686f6afc58d6bf68df30")
    public ResponseEntity<Map<String, Object>> markAttendanceByNFC(@RequestBody Map<String, Integer> requestBody) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Integer dni = requestBody.get("dni");
            if (dni == null) {
                response.put("success", false);
                response.put("message", "DNI es requerido");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Buscar usuario por DNI
            User user;
            try {
                user = userService.getUserByDni(dni);
            } catch (Exception e) {
                response.put("success", false);
                response.put("message", "Usuario con DNI " + dni + " no encontrado");
                return ResponseEntity.notFound().build();
            }
            
            LocalDate today = LocalDate.now();
            LocalDateTime now = LocalDateTime.now();
            
            // Obtener las asistencias del usuario para el día actual
            List<Attendance> todayAttendances = attendanceService.getUserAttendancesForDate(user.getId(), today);
            
            if (todayAttendances.isEmpty()) {
                response.put("success", false);
                response.put("message", "No hay clases programadas para hoy para el usuario " + user.getFullName());
                return ResponseEntity.notFound().build();
            }
            
            // Buscar la actividad relevante (la más próxima o en curso)
            Attendance relevantAttendance = null;
            Activity relevantActivity = null;
            
            for (Attendance attendance : todayAttendances) {
                Activity activity = attendance.getActivity();
                LocalDateTime activityStart = activity.getDate();
                LocalDateTime activityEnd = activityStart.plusMinutes(activity.getDuration());
                
                // Si la actividad está en curso o por empezar
                if (now.isBefore(activityEnd)) {
                    relevantAttendance = attendance;
                    relevantActivity = activity;
                    break;
                }
            }
            
            // Si no encontramos actividad relevante, todas ya terminaron
            if (relevantAttendance == null) {
                // Marcar como ausente la última actividad del día
                Attendance lastAttendance = todayAttendances.get(todayAttendances.size() - 1);
                attendanceService.updateAttendanceStatus(lastAttendance.getId(), AttendanceStatus.ABSENT);
                
                response.put("success", true);
                response.put("message", "Clase ya terminada. Marcado como ausente");
                response.put("status", "ABSENT");
                response.put("userName", user.getFullName());
                response.put("activityName", lastAttendance.getActivity().getName());
                return ResponseEntity.ok(response);
            }
            
            // Determinar el estado según las reglas
            LocalDateTime activityStart = relevantActivity.getDate();
            LocalDateTime lateThreshold = activityStart.plusMinutes(15);
            AttendanceStatus newStatus;
            String statusMessage;
            
            if (now.isBefore(activityStart)) {
                // Clase aún no empezó - presente
                newStatus = AttendanceStatus.PRESENT;
                statusMessage = "Marcado como presente (clase por empezar)";
            } else if (now.isBefore(lateThreshold)) {
                // Clase empezó hace menos de 15 minutos - presente
                newStatus = AttendanceStatus.PRESENT;
                statusMessage = "Marcado como presente";
            } else {
                // Clase empezó hace más de 15 minutos - tarde
                newStatus = AttendanceStatus.LATE;
                statusMessage = "Marcado como tarde (más de 15 minutos de retraso)";
            }
            
            // Actualizar el estado de asistencia
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
            response.put("message", "Error al procesar el marcado por NFC: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
