package com.personalfit.controllers;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.dto.User.ClientStatsDTO;
import com.personalfit.dto.User.CreateUserDTO;
import com.personalfit.dto.User.UserTypeDTO;
import com.personalfit.enums.UserRole;
import com.personalfit.enums.UserStatus;
import com.personalfit.models.User;
import com.personalfit.services.UserService;

import jakarta.validation.Valid;


@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/new")
    public ResponseEntity<Map<String, Object>> createUser(@Valid @RequestBody CreateUserDTO user) {
        userService.createNewUser(user);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Usuario creado exitosamente");
        response.put("success", true);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/public/first-admin")
    public ResponseEntity<Map<String, Object>> createFirstAdmin(@Valid @RequestBody CreateUserDTO user) {
        
        // Forzar el rol de admin y estado activo
        user.setRole(UserRole.ADMIN);
        user.setStatus(UserStatus.ACTIVE);
        
        userService.createNewUser(user);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Primer administrador creado exitosamente");
        response.put("success", true);
        response.put("role", "ADMIN");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Usuario eliminado exitosamente");
        response.put("success", true);
        response.put("userId", id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/findByDni")
    public ResponseEntity<User> findByDni(@Valid @RequestBody Integer userDni) {
        User user = userService.getUserByDni(userDni);
        return new ResponseEntity<>(user, HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<UserTypeDTO>> getAllUsers() {
        return new ResponseEntity<>(userService.getAllUsers(), HttpStatus.OK);
    }

    @GetMapping("/info/{id}")
    public ResponseEntity<UserTypeDTO> getUserInfo(@PathVariable Long id) {
        User user = userService.getUserById(id);
        UserTypeDTO userDto = userService.createUserDetailInfoDTO(user);
        return new ResponseEntity<>(userDto, HttpStatus.OK);
    }

    @GetMapping("/trainers")
    public ResponseEntity<List<UserTypeDTO>> getAllTrainers() {
        List<UserTypeDTO> trainers = userService.getAllTrainers();
        return new ResponseEntity<>(trainers, HttpStatus.OK);
    }

    // @PutMapping("/status/{id}")
    // public ResponseEntity<Void> updateUserStatus(@PathVariable Long id, String status){
    //     User user = userService.getUserById(id);
    //     userService.updateUserStatus(user, UserStatus.valueOf(status.toUpperCase()));
    //     return new ResponseEntity<>(HttpStatus.OK);
    // }

    @PutMapping("/lastAttendance/{dni}")
    public ResponseEntity<Map<String, Object>> updateLastAttendance(@PathVariable Integer dni) {
        userService.updateLastAttendanceByDni(dni);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Última asistencia actualizada exitosamente");
        response.put("success", true);
        response.put("dni", dni);
        return ResponseEntity.ok(response);
    }

    @Transactional
    @PostMapping("/batch/clients")
    public ResponseEntity<Map<String, Object>> createBatchClients(@Valid @RequestBody List<CreateUserDTO> newUsers) {
        // Forzar el rol de CLIENT y estado INACTIVE para todos los usuarios
        newUsers.forEach(user -> {
            user.setRole(UserRole.CLIENT);
            user.setStatus(UserStatus.INACTIVE);
        });
        
        Integer createdCount = userService.createBatchClients(newUsers);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Clientes creados exitosamente");
        response.put("success", true);
        response.put("createdCount", createdCount);
        response.put("role", "CLIENT");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ===== ENDPOINTS PARA ESTADÍSTICAS DEL CLIENTE =====

    /**
     * Endpoint unificado para obtener todas las estadísticas de un cliente
     * @param clientId ID del cliente
     * @return ClientStatsDTO con todas las estadísticas
     */
    @GetMapping("/stats/{clientId}")
    public ResponseEntity<ClientStatsDTO> getClientStats(@PathVariable Long clientId) {
        ClientStatsDTO stats = userService.getClientStats(clientId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Obtiene la cantidad de actividades de la semana actual para un cliente
     * @param clientId ID del cliente
     * @return Cantidad de actividades de la semana
     */
    @GetMapping("/{clientId}/weekly-activities")
    public ResponseEntity<Integer> getWeeklyActivities(@PathVariable Long clientId) {
        User client = userService.getUserById(clientId);
        Integer count = userService.getWeeklyActivityCount(client);
        return ResponseEntity.ok(count);
    }

    /**
     * Obtiene la cantidad de actividades de una semana específica para un cliente
     * @param clientId ID del cliente
     * @param date Fecha de la semana (formato YYYY-MM-DD)
     * @return Cantidad de actividades de esa semana
     */
    @GetMapping("/{clientId}/weekly-activities/{date}")
    public ResponseEntity<Integer> getWeeklyActivities(@PathVariable Long clientId, @PathVariable String date) {
        User client = userService.getUserById(clientId);
        LocalDate weekDate = LocalDate.parse(date);
        Integer count = userService.getWeeklyActivityCount(client, weekDate);
        return ResponseEntity.ok(count);
    }

    /**
     * Obtiene la próxima clase más cercana para un cliente
     * @param clientId ID del cliente
     * @return NextClassDTO con información de la próxima clase
     */
    @GetMapping("/{clientId}/next-class")
    public ResponseEntity<ClientStatsDTO.NextClassDTO> getNextClass(@PathVariable Long clientId) {
        User client = userService.getUserById(clientId);
        ClientStatsDTO.NextClassDTO nextClass = userService.getNextClass(client);
        return ResponseEntity.ok(nextClass);
    }

    /**
     * Obtiene el total de clases completadas para un cliente
     * @param clientId ID del cliente
     * @return Cantidad total de clases completadas
     */
    @GetMapping("/{clientId}/completed-classes")
    public ResponseEntity<Integer> getCompletedClasses(@PathVariable Long clientId) {
        User client = userService.getUserById(clientId);
        Integer count = userService.getCompletedClassesCount(client);
        return ResponseEntity.ok(count);
    }

    /**
     * Obtiene el estado de membresía de un cliente
     * @param clientId ID del cliente
     * @return Map con el estado de membresía
     */
    @GetMapping("/{clientId}/membership-status")
    public ResponseEntity<Map<String, Object>> getMembershipStatus(@PathVariable Long clientId) {
        User client = userService.getUserById(clientId);
        UserStatus status = userService.getMembershipStatus(client);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", status);
        response.put("clientId", clientId);
        
        return ResponseEntity.ok(response);
    }

}
