package com.personalfit.services;

import java.io.IOException;
import java.text.Normalizer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.personalfit.dto.User.ClientStatsDTO;
import com.personalfit.dto.User.CreateUserDTO;
import com.personalfit.dto.User.UserActivityDetailsDTO;
import com.personalfit.dto.User.UserDetailInfoDTO;
import com.personalfit.dto.User.UserTypeDTO;
import com.personalfit.dto.Activity.ActivitySummaryDTO;
import com.personalfit.enums.AttendanceStatus;
import com.personalfit.enums.MuscleGroup;
import com.personalfit.enums.PaymentStatus;
import com.personalfit.enums.UserRole;
import com.personalfit.enums.UserStatus;
import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.exceptions.EntityAlreadyExistsException;
import com.personalfit.exceptions.EntityNotFoundException;
import com.personalfit.exceptions.FileException;
import com.personalfit.models.Activity;
import com.personalfit.models.Attendance;
import com.personalfit.models.ActivitySummary;
import com.personalfit.models.Payment;
import com.personalfit.models.User;
import com.personalfit.repository.AttendanceRepository;
import com.personalfit.repository.PaymentRepository;
import com.personalfit.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * Service Layer: User Identity & Management
 * 
 * Core service for handling user data, lifecycle, and access control.
 * 
 * Architectural Responsibilities:
 * 1. Identity Management: Creation, authentication support, and profile
 * maintenance.
 * 2. Access Control: Validates user status (ACTIVE/INACTIVE) based on business
 * rules.
 * 3. Dashboard Analytics: Aggregates statistics for client
 * performance/attendance.
 * 4. Automated Monitoring: Daily checks for birthdays, attendance streaks, and
 * payment status.
 */
@Slf4j
@Service
public class UserService {

    private static final long MAX_AVATAR_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final long MAX_PENDING_USER_REGISTRATIONS = 99L;

    @Value("${spring.datasource.files.path}")
    private String uploadFolder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Registers a new user in the system.
     * 
     * Business Logic:
     * - DNI must be unique.
     * - Clients default to INACTIVE until first payment.
     * - Admins/Trainers default to ACTIVE immediately.
     * - Avatars are auto-generated from initials.
     * 
     * @param newUser DTO with registration details.
     * @return true if creation was successful.
     * @throws EntityAlreadyExistsException if DNI is already taken.
     */
    public Boolean createNewUser(CreateUserDTO newUser) {
        ensureUniqueDniAndEmail(newUser.getDni(), newUser.getEmail(), "Api/User/createNewUser");

        User userToCreate = createUserEntity(
                newUser,
                resolveInitialStatusForApprovedUser(newUser.getRole()),
                LocalDate.now());

        userRepository.save(userToCreate);
        log.info("New user created: {} ({})", userToCreate.getFullName(), userToCreate.getRole());

        return true;
    }

    /**
     * Public registration flow.
     * Creates a user request in PENDING_APPROVAL state until an admin validates it.
     */
    public Boolean createPendingUserRegistration(CreateUserDTO newUser) {
        long pendingRequests = userRepository.countByStatus(UserStatus.PENDING_APPROVAL);
        if (pendingRequests >= MAX_PENDING_USER_REGISTRATIONS) {
            throw new BusinessRuleException(
                    "No se pueden recibir mÃ¡s solicitudes por el momento. Intenta nuevamente mÃ¡s tarde.",
                    "Api/User/createPendingUserRegistration");
        }

        // Public registration only allows CLIENT role.
        newUser.setRole(UserRole.CLIENT);
        ensureUniqueDniAndEmail(newUser.getDni(), newUser.getEmail(), "Api/User/createPendingUserRegistration");

        User pendingUser = createUserEntity(newUser, UserStatus.PENDING_APPROVAL, LocalDate.now());
        userRepository.save(pendingUser);

        log.info("New pending registration created: {} ({})", pendingUser.getFullName(), pendingUser.getRole());
        return true;
    }

    /**
     * Lists users awaiting admin validation.
     */
    public List<UserTypeDTO> getPendingUserRegistrations() {
        return userRepository.findAllByStatusOrderByIdAsc(UserStatus.PENDING_APPROVAL).stream()
                .map(UserTypeDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Approves a pending registration.
     * Client accounts become INACTIVE until payment; staff become ACTIVE.
     */
    public void approvePendingUser(Long userId) {
        User user = getUserById(userId);
        if (user.getStatus() != UserStatus.PENDING_APPROVAL) {
            throw new BusinessRuleException(
                    "Solo se pueden aprobar usuarios en estado pendiente.",
                    "Api/User/approvePendingUser");
        }

        user.setStatus(resolveInitialStatusForApprovedUser(user.getRole()));
        userRepository.save(user);
        log.info("Pending user approved: ID={}, Role={}", userId, user.getRole());
    }

    /**
     * Rejects a pending registration and removes it from the system.
     */
    public void rejectPendingUser(Long userId) {
        User user = getUserById(userId);
        if (user.getStatus() != UserStatus.PENDING_APPROVAL) {
            throw new BusinessRuleException(
                    "Solo se pueden rechazar usuarios en estado pendiente.",
                    "Api/User/rejectPendingUser");
        }

        userRepository.delete(user);
        log.info("Pending user rejected and deleted: ID={}", userId);
    }

    /**
     * Deletes a user by their ID.
     */
    public Boolean deleteUser(Long id) {
        Optional<User> user = userRepository.findById(id);

        if (user.isEmpty())
            throw new EntityNotFoundException("User ID: " + id + " not found", "Api/User/deleteUser");

        try {
            userRepository.delete(user.get());
            log.info("User deleted: ID {}", id);
        } catch (Exception e) {
            log.error("Failed to delete user ID {}: {}", id, e.getMessage());
            return false;
        }

        return true;
    }

    /**
     * Retrieves a user by their DNI (Document Number).
     */
    public User getUserByDni(Integer dni) {
        return userRepository.findByDni(dni)
                .orElseThrow(
                        () -> new EntityNotFoundException("User DNI: " + dni + " not found", "Api/User/getUserByDni"));
    }

    /**
     * Admin Dashboard: List users (excluding Admins).
     * Enriches user data with:
     * - Calculated Age.
     * - Last Activity Date.
     * - Total Activity Count.
     */
    public List<UserTypeDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserTypeDTO> usersDto = new ArrayList<>();

        users.forEach(user -> {
            UserTypeDTO newUserDto = new UserTypeDTO(user);
            Integer age = getUserAge(user);
            newUserDto.setAge(age);

            // TODO: Implement actual 'Last Activity' logic (currently hardcoded to now)
            newUserDto.setLastActivity(LocalDate.now());
            newUserDto.setActivitiesCount(user.getAttendances().size());

            usersDto.add(newUserDto);
        });

        // Exclude Admins from general list
        return usersDto.stream()
                .filter(u -> !u.getRole().equals(UserRole.ADMIN))
                .filter(u -> u.getStatus() != UserStatus.PENDING_APPROVAL)
                .collect(Collectors.toList());
    }

    /**
     * Helper: Calculates Age from BirthDate.
     * Returns null if BirthDate is missing.
     */
    public Integer getUserAge(User user) {
        if (user.getBirthDate() == null)
            return null;

        LocalDate today = LocalDate.now();
        Integer age = today.getYear() - user.getBirthDate().getYear();

        if (today.getDayOfYear() < user.getBirthDate().getDayOfYear()) {
            age--; // Birthday hasn't happened yet this year
        }

        return age;
    }

    /**
     * Retrieves a user by their database ID.
     */
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(
                        () -> new EntityNotFoundException("User ID: " + id + " not found", "Api/User/getUserById"));
    }

    /**
     * Retrieves a user by their email address.
     */
    public User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new EntityNotFoundException("User Email: " + email + " not found",
                        "Api/User/getUserByEmail"));
    }

    /**
     * Detailed Profile View.
     * Aggregates attendance history and trainer information for a specific user.
     */
    public UserDetailInfoDTO createUserDetailInfoDTO(User user) {
        UserDetailInfoDTO userDto = new UserDetailInfoDTO(user);
        userDto.setAge(getUserAge(user));

        // Map Attendance History
        user.getAttendances().forEach(attendance -> {
            userDto.getListActivity().add(UserActivityDetailsDTO.builder()
                    .id(attendance.getActivity().getId())
                    .name(attendance.getActivity().getName())
                    .trainerName(attendance.getActivity().getTrainer().getFirstName() + " "
                            + attendance.getActivity().getTrainer().getLastName())
                    .date(attendance.getActivity().getDate())
                    .activityStatus(attendance.getActivity().getStatus())
                    .clientStatus(attendance.getAttendance())
                    .summary(convertToActivitySummaryDTO(attendance.getActivitySummary()))
                    .build());
        });

        userDto.setLastActivity(LocalDate.now()); // Placeholder
        userDto.setActivitiesCount(user.getAttendances().size());

        return userDto;
    }

    private ActivitySummaryDTO convertToActivitySummaryDTO(ActivitySummary summary) {
        if (summary == null) {
            return null;
        }

        List<MuscleGroup> muscleGroups = new ArrayList<>();
        if (summary.getMuscleGroups() != null && !summary.getMuscleGroups().isEmpty()) {
            muscleGroups.addAll(summary.getMuscleGroups());
        } else if (summary.getMuscleGroup() != null) {
            muscleGroups.add(summary.getMuscleGroup());
        }

        return ActivitySummaryDTO.builder()
                .id(summary.getId())
                .muscleGroups(muscleGroups)
                .muscleGroup(muscleGroups.isEmpty() ? null : muscleGroups.get(0))
                .effortLevel(summary.getEffortLevel())
                .trainingDescription(summary.getTrainingDescription())
                .createdAt(summary.getCreatedAt())
                .updatedAt(summary.getUpdatedAt())
                .build();
    }

    /**
     * Retrieves all users with TRAINER or ADMIN roles.
     * Excludes the Super Admin.
     */
    public List<UserTypeDTO> getAllTrainers() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole().equals(UserRole.TRAINER) || user.getRole().equals(UserRole.ADMIN))
                .filter(user -> !user.getDni().equals(99999999)) // Exclude Super Admin
                .map(UserTypeDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Updates a user's status (ACTIVE, INACTIVE).
     */
    public void updateUserStatus(User user, UserStatus status) {
        if (user == null)
            throw new EntityNotFoundException("User cannot be null", "Api/User/updateUserStatus");

        user.setStatus(status);
        userRepository.save(user);
        log.info("User status updated for ID {}: {}", user.getId(), status);
    }

    /**
     * Retrieves all users with the ADMIN role.
     */
    public List<User> getAllAdmins() {
        return userRepository.findAllByRole(UserRole.ADMIN);
    }

    /**
     * Bulk Notification Targets.
     * Returns all users eligible for mass announcements (Non-Admins).
     */
    public List<User> getAllNonAdminUsers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != UserRole.ADMIN)
                .filter(u -> u.getStatus() != UserStatus.PENDING_APPROVAL)
                .collect(Collectors.toList());
    }

    public List<User> getAll(List<Long> id) {
        return userRepository.findByIdIn(id);
    }

    /**
     * Updates the timestamp of the last verified attendance.
     * Called when scanning a QR code or marking attendance manually.
     */
    public void updateLastAttendanceByDni(Integer dni) {
        User user = getUserByDni(dni);
        user.setLastAttendance(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * Batch Processor.
     * Imports multiple clients at once, skipping existing DNIs.
     * 
     * @param newUsers List of users to import.
     * @return Number of successfully created users.
     */
    public Integer createBatchClients(List<CreateUserDTO> newUsers) {
        List<User> usersToSave = new ArrayList<>();

        for (CreateUserDTO newUser : newUsers) {
            ensureUniqueDniAndEmail(newUser.getDni(), newUser.getEmail(), "Api/User/createBatchClients");

            UserStatus status = newUser.getStatus() != null ? newUser.getStatus() : UserStatus.INACTIVE;
            User userToCreate = createUserEntity(newUser, status, LocalDate.now());
            usersToSave.add(userToCreate);
        }

        List<User> savedUsers = userRepository.saveAll(usersToSave);
        log.info("Batch created {} new users", savedUsers.size());
        return savedUsers.size();
    }

    /**
     * CRON JOB: Daily Status Audit (03:00 AM).
     * Deactivates users whose payments have expired.
     */
    @Scheduled(cron = "0 0 3 * * ?")
    public void userStatusDailyCheck() {
        log.info("Starting daily user status audit...");
        List<User> users = userRepository.findAllByStatus(UserStatus.ACTIVE);
        List<User> toUpdate = new ArrayList<>();

        users.forEach(u -> {
            if (u.getRole().equals(UserRole.TRAINER) || u.getRole().equals(UserRole.ADMIN))
                return;

            Optional<Payment> payment = paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(u,
                    PaymentStatus.PAID);

            if (payment.isEmpty()
                    || payment.get().getExpiresAt() == null
                    || !payment.get().getExpiresAt().toLocalDate().isAfter(LocalDate.now())) {
                u.setStatus(UserStatus.INACTIVE);
                toUpdate.add(u);
                log.info("Deactivating user {}: Membership expired.", u.getFullName());
            }
        });

        if (!toUpdate.isEmpty()) {
            userRepository.saveAll(toUpdate);

            // Notify staff about deactivated users
            log.info("Notifying admins about {} expired memberships.", toUpdate.size());
            notificationService.createPaymentExpiredNotification(toUpdate, getAllAdmins());
        }
    }

    /**
     * CRON JOB: Birthday Greeter (00:01 AM).
     * Sends birthday notifications to users and admins.
     */
    @Scheduled(cron = "0 1 0 * * ?")
    public void userBirthdayCheck() {
        log.info("Checking for birthdays...");
        List<User> users = userRepository.findAllByBirthDate(LocalDate.now());

        if (!users.isEmpty()) {
            log.info("Found {} birthdays today.", users.size());
            notificationService.createBirthdayNotification(users, getAllAdmins());
        }
    }

    /**
     * CRON JOB: Attendance Monitor (02:45 AM).
     * Alerts users who haven't attended in the last 7 days.
     * Note: Uses a specific query to alert only on the 4th day of absence (logic
     * specific to query).
     */
    @Scheduled(cron = "0 45 2 * * ?")
    public void userAttendanceCheck() {
        log.info("Checking attendance streaks...");
        LocalDateTime dateLimit = LocalDateTime.now().minusDays(7);

        // Find users active but absent since dateLimit
        List<User> users = userRepository.findActiveUsersWithLastAttendanceOn(UserStatus.ACTIVE,
                dateLimit.toLocalDate());

        if (!users.isEmpty()) {
            log.info("Sending attendance warnings to {} users.", users.size());
            notificationService.createAttendanceWarningNotification(users, getAllAdmins());
        }
    }

    /**
     * Client Dashboard Stats.
     * Aggregates key metrics for the client mobile app home screen.
     * 
     * @param clientId Target ID
     * @return DTO with attendance counts, next class info, and plan status.
     * @throws IllegalArgumentException if user is not a Client.
     */
    public ClientStatsDTO getClientStats(Long clientId) {
        User client = getUserById(clientId);
        if (!client.getRole().equals(UserRole.CLIENT)) {
            throw new IllegalArgumentException("User is not a client");
        }

        return ClientStatsDTO.builder()
                .weeklyActivityCount(getCurrentMonthActivityCount(client))
                .nextClass(getNextClass(client))
                .completedClassesCount(getCompletedClassesCount(client))
                .membershipStatus(client.getStatus())
                .remainingDays(getRemainingPlanDays(client))
                .build();
    }

    /**
     * Metric: Current Month Attendance Count.
     * Counts attendances in the current calendar month.
     * Includes PRESENT and LATE, excludes ABSENT/PENDING.
     */
    public Integer getCurrentMonthActivityCount(User client) {
        LocalDate today = LocalDate.now();
        LocalDate firstDayOfMonth = today.withDayOfMonth(1);
        LocalDate lastDayOfMonth = today.withDayOfMonth(today.lengthOfMonth());

        LocalDateTime startOfMonth = firstDayOfMonth.atStartOfDay();
        LocalDateTime endOfMonth = lastDayOfMonth.atTime(23, 59, 59);

        return (int) attendanceRepository.findByUser(client).stream()
                .filter(attendance -> isAttendanceWithinRange(attendance, startOfMonth, endOfMonth))
                .filter(this::countsAsCompletedAttendance)
                .count();
    }

    /**
     * Metric: Weekly Attendance Count.
     * Counts how many classes the user attended "This Week" (Mon-Sun).
     */
    public Integer getWeeklyActivityCount(User client) {
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate sunday = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        LocalDateTime startOfWeek = monday.atStartOfDay();
        LocalDateTime endOfWeek = sunday.atTime(23, 59, 59);

        return (int) attendanceRepository.findByUser(client).stream()
                .filter(attendance -> isAttendanceWithinRange(attendance, startOfWeek, endOfWeek))
                .filter(this::countsAsCompletedAttendance)
                .count();
    }

    /**
     * Metric: Weekly Attendance Count (Historic).
     * Counts attendance for a specific past week.
     */
    public Integer getWeeklyActivityCount(User client, LocalDate weekStartDate) {
        LocalDate monday = weekStartDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate sunday = monday.plusDays(6);

        LocalDateTime startOfWeek = monday.atStartOfDay();
        LocalDateTime endOfWeek = sunday.atTime(23, 59, 59);

        return (int) attendanceRepository.findByUser(client).stream()
                .filter(attendance -> isAttendanceWithinRange(attendance, startOfWeek, endOfWeek))
                .filter(this::countsAsCompletedAttendance)
                .count();
    }

    /**
     * Metric: Upcoming Class.
     * Finds the nearest future class the user is enrolled in.
     */
    public ClientStatsDTO.NextClassDTO getNextClass(User client) {
        LocalDateTime now = LocalDateTime.now();

        Optional<Attendance> nextAttendance = attendanceRepository.findByUser(client).stream()
                .filter(attendance -> attendance.getActivity().getDate().isAfter(now))
                .filter(attendance -> attendance.getAttendance().equals(AttendanceStatus.PENDING)
                        || attendance.getAttendance().equals(AttendanceStatus.PRESENT))
                .min((a1, a2) -> a1.getActivity().getDate().compareTo(a2.getActivity().getDate()));

        if (nextAttendance.isPresent()) {
            Activity activity = nextAttendance.get().getActivity();
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

            return ClientStatsDTO.NextClassDTO.builder()
                    .id(activity.getId())
                    .name(activity.getName())
                    .date(activity.getDate())
                    .time(activity.getDate().format(timeFormatter))
                    .build();
        }

        return null;
    }

    /**
     * Metric: Total Lifetime Attendance.
     */
    public Integer getCompletedClassesCount(User client) {
        return (int) attendanceRepository.findByUser(client).stream()
                .filter(this::countsAsCompletedAttendance)
                .count();
    }

    private boolean isAttendanceWithinRange(Attendance attendance, LocalDateTime start, LocalDateTime end) {
        LocalDateTime activityDate = attendance.getActivity().getDate();
        return !activityDate.isBefore(start) && !activityDate.isAfter(end);
    }

    private boolean countsAsCompletedAttendance(Attendance attendance) {
        return attendance.getAttendance().equals(AttendanceStatus.PRESENT)
                || attendance.getAttendance().equals(AttendanceStatus.LATE);
    }

    public UserStatus getMembershipStatus(User client) {
        return client.getStatus();
    }

    /**
     * Security: Password Rotation.
     * Validates current password before updating.
     */
    public void updatePassword(Long userId, String currentPassword, String newPassword) {
        log.info("Updating password for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId,
                        "UserService/updatePassword"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            log.warn("Password update failed: Invalid current password");
            throw new IllegalArgumentException("Incorrect current password");
        }

        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            log.warn("Password update failed: New password same as current");
            throw new IllegalArgumentException("New password must be different");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Password updated successfully");
    }

    /**
     * Resets a client password to their DNI.
     * Only intended for administrative recovery actions.
     */
    public void resetClientPasswordToDni(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId,
                        "UserService/resetClientPasswordToDni"));

        if (!UserRole.CLIENT.equals(user.getRole())) {
            throw new IllegalArgumentException("Solo se puede reiniciar la contraseña de usuarios con rol CLIENT");
        }

        if (user.getDni() == null) {
            throw new IllegalArgumentException("El cliente no tiene DNI configurado");
        }

        user.setPassword(passwordEncoder.encode(String.valueOf(user.getDni())));
        userRepository.save(user);
        log.info("Password reset to DNI for client ID: {}", userId);
    }

    /**
     * Profile Management.
     * Updates non-sensitive user details.
     */
    public void updateProfile(com.personalfit.dto.User.UpdateProfileDTO updateProfileDTO) {
        log.info("Updating profile for user ID: {}", updateProfileDTO.getUserId());

        User user = userRepository.findById(updateProfileDTO.getUserId())
                .orElseThrow(
                        () -> new EntityNotFoundException("User not found with id: " + updateProfileDTO.getUserId(),
                                "UserService/updateProfile"));

        boolean changed = false;

        if (updateProfileDTO.getAddress() != null && !updateProfileDTO.getAddress().trim().isEmpty()) {
            user.setAddress(updateProfileDTO.getAddress().trim());
            changed = true;
        }

        if (updateProfileDTO.getPhone() != null && !updateProfileDTO.getPhone().trim().isEmpty()) {
            user.setPhone(updateProfileDTO.getPhone().trim());
            changed = true;
        }

        if (updateProfileDTO.getEmergencyPhone() != null) {
            user.setEmergencyPhone(updateProfileDTO.getEmergencyPhone().trim().isEmpty() ? null
                    : updateProfileDTO.getEmergencyPhone().trim());
            changed = true;
        }

        if (changed) {
            userRepository.save(user);
            log.info("Profile updated successfully");
        }
    }

    @Transactional
    public UserTypeDTO uploadAvatar(Long userId, MultipartFile file) {
        User user = getUserById(userId);
        validateAvatarFile(file);

        try {
            Path avatarDirectory = getAvatarDirectory();
            Files.createDirectories(avatarDirectory);

            deleteAvatarFileIfPresent(user);

            String extension = getFileExtension(file.getOriginalFilename());
            String fileName = buildAvatarFileName(user, extension);
            Path avatarPath = avatarDirectory.resolve(fileName);

            Files.copy(file.getInputStream(), avatarPath, StandardCopyOption.REPLACE_EXISTING);

            user.setAvatar("avatars/" + fileName);
            userRepository.save(user);

            log.info("Avatar uploaded for user ID {}: {}", userId, fileName);
            return new UserTypeDTO(user);
        } catch (IOException e) {
            log.error("Error storing avatar for user {}: {}", userId, e.getMessage());
            throw new FileException("No se pudo guardar la foto de perfil", "/api/users/" + userId + "/avatar");
        }
    }

    @Transactional
    public UserTypeDTO deleteAvatar(Long userId) {
        User user = getUserById(userId);
        deleteAvatarFileIfPresent(user);
        user.setAvatar(buildInitialAvatar(user.getFirstName(), user.getLastName()));
        userRepository.save(user);

        log.info("Avatar deleted for user ID {}", userId);
        return new UserTypeDTO(user);
    }

    public byte[] getAvatarContent(Long userId) {
        User user = getUserById(userId);
        Path avatarPath = resolveAvatarPath(user);

        try {
            if (!Files.exists(avatarPath)) {
                throw new FileException("La foto de perfil no existe", "/api/users/" + userId + "/avatar");
            }
            return Files.readAllBytes(avatarPath);
        } catch (IOException e) {
            log.error("Error reading avatar for user {}: {}", userId, e.getMessage());
            throw new FileException("No se pudo leer la foto de perfil", "/api/users/" + userId + "/avatar");
        }
    }

    public String getAvatarContentType(Long userId) {
        User user = getUserById(userId);
        Path avatarPath = resolveAvatarPath(user);

        try {
            String contentType = Files.probeContentType(avatarPath);
            return contentType != null ? contentType : "application/octet-stream";
        } catch (IOException e) {
            return "application/octet-stream";
        }
    }

    /**
     * Helper: Calculates days remaining on active plan.
     * Returns 0 if expired or not found.
     */
    public Integer getRemainingPlanDays(User client) {
        Optional<Payment> lastPaidPayment = paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(
                client, PaymentStatus.PAID);

        if (lastPaidPayment.isEmpty()) {
            return 0;
        }

        Payment payment = lastPaidPayment.get();

        if (payment.getExpiresAt() == null) {
            return 0;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = payment.getExpiresAt();

        if (expiresAt.isBefore(now) || expiresAt.isEqual(now)) {
            return 0;
        }

        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(now.toLocalDate(), expiresAt.toLocalDate());
        return Math.max(0, (int) daysBetween);
    }

    private void ensureUniqueDniAndEmail(String dni, String email, String path) {
        Integer parsedDni = Integer.parseInt(dni.trim());
        if (userRepository.findByDni(parsedDni).isPresent()) {
            throw new EntityAlreadyExistsException("User already exists with DNI: " + dni.trim(), path);
        }

        String normalizedEmail = normalizeEmail(email);
        if (userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent()) {
            throw new EntityAlreadyExistsException("User already exists with Email: " + normalizedEmail, path);
        }
    }

    private User createUserEntity(CreateUserDTO source, UserStatus status, LocalDate joinDate) {
        String normalizedDni = source.getDni().trim();
        UserRole role = source.getRole() != null ? source.getRole() : UserRole.CLIENT;
        String rawPassword = source.getPassword() != null && !source.getPassword().trim().isEmpty()
                ? source.getPassword().trim()
                : normalizedDni;

        User user = new User();
        user.setDni(Integer.parseInt(normalizedDni));
        user.setFirstName(source.getFirstName().trim());
        user.setLastName(source.getLastName().trim());
        user.setEmail(normalizeEmail(source.getEmail()));
        user.setPhone(normalizeOptionalText(source.getPhone()));
        user.setEmergencyPhone(normalizeOptionalText(source.getEmergencyPhone()));
        user.setRole(role);
        user.setAvatar(buildInitialAvatar(user.getFirstName(), user.getLastName()));
        user.setJoinDate(joinDate != null ? joinDate : LocalDate.now());
        user.setAddress(source.getAddress().trim());
        user.setBirthDate(source.getBirthDate());
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setStatus(status);
        return user;
    }

    private UserStatus resolveInitialStatusForApprovedUser(UserRole role) {
        return role == UserRole.CLIENT ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    }

    private String normalizeEmail(String email) {
        return email.toLowerCase().trim();
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String buildInitialAvatar(String firstName, String lastName) {
        return firstName.substring(0, 1).toUpperCase(Locale.ROOT)
                + lastName.substring(0, 1).toUpperCase(Locale.ROOT);
    }

    private void validateAvatarFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileException("La imagen de perfil está vacía", "/api/users/avatar");
        }

        if (file.getSize() > MAX_AVATAR_SIZE_BYTES) {
            throw new FileException("La foto de perfil no puede superar los 5MB", "/api/users/avatar");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new FileException("Solo se permiten imágenes para la foto de perfil", "/api/users/avatar");
        }
    }

    private Path getAvatarDirectory() {
        return Paths.get(uploadFolder, "avatars");
    }

    private void deleteAvatarFileIfPresent(User user) {
        if (!hasCustomAvatar(user)) {
            return;
        }

        try {
            Files.deleteIfExists(resolveAvatarPath(user));
        } catch (IOException e) {
            log.warn("Could not delete previous avatar for user {}: {}", user.getId(), e.getMessage());
        }
    }

    private Path resolveAvatarPath(User user) {
        if (!hasCustomAvatar(user)) {
            throw new FileException("El usuario no tiene una foto de perfil cargada", "/api/users/" + user.getId() + "/avatar");
        }

        String avatarValue = user.getAvatar().replace("\\", "/");
        String relativePath = avatarValue.startsWith("avatars/") ? avatarValue.substring("avatars/".length()) : avatarValue;
        return getAvatarDirectory().resolve(relativePath);
    }

    private boolean hasCustomAvatar(User user) {
        return user.getAvatar() != null && user.getAvatar().startsWith("avatars/");
    }

    private String buildAvatarFileName(User user, String extension) {
        String fullName = sanitizeFileComponent(user.getFullName().replace(" ", "_"));
        return user.getId() + "_" + fullName + extension;
    }

    private String sanitizeFileComponent(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        return normalized
                .replaceAll("[^A-Za-z0-9_]+", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
    }

    private String getFileExtension(String originalFileName) {
        if (originalFileName == null || !originalFileName.contains(".")) {
            return ".jpg";
        }

        return originalFileName.substring(originalFileName.lastIndexOf(".")).toLowerCase(Locale.ROOT);
    }
}
