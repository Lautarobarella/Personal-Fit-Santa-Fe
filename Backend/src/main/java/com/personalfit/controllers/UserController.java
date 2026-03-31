package com.personalfit.controllers;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.personalfit.dto.User.ClientStatsDTO;
import com.personalfit.dto.User.CreateUserDTO;
import com.personalfit.dto.User.UpdatePasswordDTO;
import com.personalfit.dto.User.UpdateProfileDTO;
import com.personalfit.dto.User.UserTypeDTO;
import com.personalfit.enums.UserRole;
import com.personalfit.enums.UserStatus;
import com.personalfit.models.User;
import com.personalfit.services.UserService;

import jakarta.validation.Valid;

/**
 * Controller for User Management.
 * Handles user creation, profile updates, and retrieving user statistics.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * Create a new user (Client).
     */
    @PostMapping("/new")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createUser(@Valid @RequestBody CreateUserDTO user) {
        userService.createNewUser(user);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User created successfully");
        response.put("success", true);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Public registration request.
     * The account remains pending until an admin approves it.
     */
    @PostMapping("/public/register")
    public ResponseEntity<Map<String, Object>> createPendingRegistration(@Valid @RequestBody CreateUserDTO user) {
        userService.createPendingUserRegistration(user);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Registration request sent successfully");
        response.put("success", true);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all users pending validation by admin.
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserTypeDTO>> getPendingUsers() {
        return new ResponseEntity<>(userService.getPendingUserRegistrations(), HttpStatus.OK);
    }

    /**
     * Approve a pending user registration.
     */
    @PutMapping("/pending/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> approvePendingUser(@PathVariable Long id) {
        userService.approvePendingUser(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User approved successfully");
        response.put("success", true);
        response.put("userId", id);
        return ResponseEntity.ok(response);
    }

    /**
     * Reject a pending user registration.
     */
    @DeleteMapping("/pending/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> rejectPendingUser(@PathVariable Long id) {
        userService.rejectPendingUser(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User rejected successfully");
        response.put("success", true);
        response.put("userId", id);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a user by ID.
     */
    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User deleted successfully");
        response.put("success", true);
        response.put("userId", id);
        return ResponseEntity.ok(response);
    }

    /**
     * Find user model by DNI (Internal use).
     */
    @GetMapping("/findByDni")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> findByDni(@Valid @RequestBody Integer userDni) {
        User user = userService.getUserByDni(userDni);
        return new ResponseEntity<>(user, HttpStatus.OK);
    }

    /**
     * Get User DTO by DNI.
     */
    @GetMapping("/by-dni/{dni}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT') or hasRole('TRAINER')")
    public ResponseEntity<UserTypeDTO> getUserByDni(@PathVariable Integer dni) {
        User user = userService.getUserByDni(dni);
        UserTypeDTO userDto = userService.createUserDetailInfoDTO(user);
        return new ResponseEntity<>(userDto, HttpStatus.OK);
    }

    /**
     * Get all users.
     */
    @GetMapping("/getAll")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserTypeDTO>> getAllUsers() {
        return new ResponseEntity<>(userService.getAllUsers(), HttpStatus.OK);
    }

    /**
     * Get specific user info by ID.
     */
    @GetMapping("/info/{id}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<UserTypeDTO> getUserInfo(@PathVariable Long id) {
        User user = userService.getUserById(id);
        UserTypeDTO userDto = userService.createUserDetailInfoDTO(user);
        return new ResponseEntity<>(userDto, HttpStatus.OK);
    }

    /**
     * Get all trainers.
     */
    @GetMapping("/trainers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserTypeDTO>> getAllTrainers() {
        List<UserTypeDTO> trainers = userService.getAllTrainers();
        return new ResponseEntity<>(trainers, HttpStatus.OK);
    }

    /**
     * Update last attendance timestamp for a user.
     */
    @PutMapping("/lastAttendance/{dni}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateLastAttendance(@PathVariable Integer dni) {
        userService.updateLastAttendanceByDni(dni);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Last attendance updated successfully");
        response.put("success", true);
        response.put("dni", dni);
        return ResponseEntity.ok(response);
    }

    /**
     * Update User Password.
     * Users can update their own password. Admins can update any password (logic
     * handled inside).
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT')")
    @PutMapping("/update-password")
    public ResponseEntity<Map<String, Object>> updatePassword(
            @Valid @RequestBody UpdatePasswordDTO updatePasswordDTO,
            Authentication authentication) {
        try {
            // Check permissions
            String currentUserEmail = authentication.getName();
            User currentUser = userService.getUserByEmail(currentUserEmail);

            // Allow if ADMIN or if user is updating their own password
            if (!currentUser.getRole().equals(UserRole.ADMIN) &&
                    !currentUser.getId().equals(updatePasswordDTO.getUserId())) {
                Map<String, Object> response = new HashMap<>();
                response.put("message", "You do not have permission to change another user's password");
                response.put("success", false);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            userService.updatePassword(
                    updatePasswordDTO.getUserId(),
                    updatePasswordDTO.getCurrentPassword(),
                    updatePasswordDTO.getNewPassword());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Password updated successfully");
            response.put("success", true);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", e.getMessage());
            response.put("success", false);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Reset client password to DNI.
     * Admin-only irreversible action.
     */
    @PutMapping("/{userId}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> resetClientPassword(@PathVariable Long userId) {
        try {
            userService.resetClientPasswordToDni(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Password reset successfully");
            response.put("success", true);
            response.put("userId", userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", e.getMessage());
            response.put("success", false);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Update User Profile (Non-sensitive data).
     */
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    @PutMapping("/update-profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @Valid @RequestBody UpdateProfileDTO updateProfileDTO,
            Authentication authentication) {
        try {
            // Check permissions
            String currentUserEmail = authentication.getName();
            User currentUser = userService.getUserByEmail(currentUserEmail);

            // Allow if ADMIN or if user is updating their own profile
            if (!currentUser.getRole().equals(UserRole.ADMIN) &&
                    !currentUser.getId().equals(updateProfileDTO.getUserId())) {
                Map<String, Object> response = new HashMap<>();
                response.put("message", "You do not have permission to edit another user's profile");
                response.put("success", false);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            userService.updateProfile(updateProfileDTO);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Profile updated successfully");
            response.put("success", true);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", e.getMessage());
            response.put("success", false);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Upload user avatar.
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT') or hasRole('TRAINER')")
    @PostMapping(value = "/{userId}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserTypeDTO> uploadAvatar(
            @PathVariable Long userId,
            @RequestPart("file") MultipartFile file,
            Authentication authentication) {

        validateSelfOrAdmin(userId, authentication);
        return ResponseEntity.ok(userService.uploadAvatar(userId, file));
    }

    /**
     * Delete user avatar and restore initials fallback.
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT') or hasRole('TRAINER')")
    @DeleteMapping("/{userId}/avatar")
    public ResponseEntity<UserTypeDTO> deleteAvatar(
            @PathVariable Long userId,
            Authentication authentication) {

        validateSelfOrAdmin(userId, authentication);
        return ResponseEntity.ok(userService.deleteAvatar(userId));
    }

    /**
     * Download current avatar image for a user.
     */
    @GetMapping("/{userId}/avatar")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CLIENT') or hasRole('TRAINER')")
    public ResponseEntity<byte[]> getAvatar(@PathVariable Long userId) {
        byte[] content = userService.getAvatarContent(userId);
        String contentType = userService.getAvatarContentType(userId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(content);
    }

    /**
     * Batch create clients.
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/batch/clients")
    public ResponseEntity<Map<String, Object>> createBatchClients(@Valid @RequestBody List<CreateUserDTO> newUsers) {
        Integer createdCount = userService.createBatchClients(newUsers);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Users batch created successfully");
        response.put("success", true);
        response.put("createdCount", createdCount);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ===================================
    // CLIENT STATISTICS ENDPOINTS
    // ===================================

    /**
     * Get aggregated stats for a client.
     */
    @GetMapping("/stats/{clientId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<ClientStatsDTO> getClientStats(@PathVariable Long clientId) {
        ClientStatsDTO stats = userService.getClientStats(clientId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get number of activities this week for a client.
     */
    @GetMapping("/{clientId}/weekly-activities")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<Integer> getWeeklyActivities(@PathVariable Long clientId) {
        User client = userService.getUserById(clientId);
        Integer count = userService.getWeeklyActivityCount(client);
        return ResponseEntity.ok(count);
    }

    /**
     * Get number of activities for a specific week for a client.
     */
    @GetMapping("/{clientId}/weekly-activities/{date}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<Integer> getWeeklyActivities(@PathVariable Long clientId, @PathVariable String date) {
        User client = userService.getUserById(clientId);
        LocalDate weekDate = LocalDate.parse(date);
        Integer count = userService.getWeeklyActivityCount(client, weekDate);
        return ResponseEntity.ok(count);
    }

    /**
     * Get the next upcoming class for a client.
     */
    @GetMapping("/{clientId}/next-class")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<ClientStatsDTO.NextClassDTO> getNextClass(@PathVariable Long clientId) {
        User client = userService.getUserById(clientId);
        ClientStatsDTO.NextClassDTO nextClass = userService.getNextClass(client);
        return ResponseEntity.ok(nextClass);
    }

    /**
     * Get total completed classes count.
     */
    @GetMapping("/{clientId}/completed-classes")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<Integer> getCompletedClasses(@PathVariable Long clientId) {
        User client = userService.getUserById(clientId);
        Integer count = userService.getCompletedClassesCount(client);
        return ResponseEntity.ok(count);
    }

    /**
     * Get client membership status (Active, Inactive, Blocked).
     */
    @GetMapping("/{clientId}/membership-status")
    @PreAuthorize("hasRole('CLIENT') or hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getMembershipStatus(@PathVariable Long clientId) {
        User client = userService.getUserById(clientId);
        UserStatus status = userService.getMembershipStatus(client);

        Map<String, Object> response = new HashMap<>();
        response.put("status", status);
        response.put("clientId", clientId);

        return ResponseEntity.ok(response);
    }

    private void validateSelfOrAdmin(Long targetUserId, Authentication authentication) {
        String currentUserEmail = authentication.getName();
        User currentUser = userService.getUserByEmail(currentUserEmail);

        if (!currentUser.getRole().equals(UserRole.ADMIN) &&
                !currentUser.getId().equals(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You do not have permission to edit another user's avatar");
        }
    }

}
