package com.personalfit.services;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.personalfit.dto.User.ClientStatsDTO;
import com.personalfit.dto.User.CreateUserDTO;
import com.personalfit.dto.User.UserActivityDetailsDTO;
import com.personalfit.dto.User.UserDetailInfoDTO;
import com.personalfit.dto.User.UserTypeDTO;
import com.personalfit.enums.AttendanceStatus;
import com.personalfit.enums.PaymentStatus;
import com.personalfit.enums.UserRole;
import com.personalfit.enums.UserStatus;
import com.personalfit.exceptions.EntityAlreadyExistsException;
import com.personalfit.exceptions.EntityNotFoundException;
import com.personalfit.models.Activity;
import com.personalfit.models.Attendance;
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
        Optional<User> user = userRepository.findByDni(Integer.parseInt(newUser.getDni()));

        if (user.isPresent())
            throw new EntityAlreadyExistsException("User already exists with DNI: " + newUser.getDni(),
                    "Api/User/createNewUser");

        User userToCreate = new User();
        userToCreate.setDni(Integer.parseInt(newUser.getDni()));
        userToCreate.setFirstName(newUser.getFirstName());
        userToCreate.setLastName(newUser.getLastName());
        userToCreate.setEmail(newUser.getEmail());
        userToCreate.setPhone(newUser.getPhone());
        userToCreate.setEmergencyPhone(newUser.getEmergencyPhone());
        userToCreate.setRole(newUser.getRole());

        // Auto-generate avatar initials (e.g., "Juan Perez" -> "JP")
        String initialAvatar = newUser.getFirstName().substring(0, 1).toUpperCase() +
                newUser.getLastName().substring(0, 1).toUpperCase();
        userToCreate.setAvatar(initialAvatar);

        userToCreate.setJoinDate(LocalDate.now());
        userToCreate.setAddress(newUser.getAddress());
        userToCreate.setBirthDate(newUser.getBirthDate());
        userToCreate.setPassword(passwordEncoder.encode(newUser.getPassword()));

        // Set Initial Status based on Role
        if (userToCreate.getRole().equals(UserRole.CLIENT))
            userToCreate.setStatus(UserStatus.INACTIVE); // Waits for payment
        else
            userToCreate.setStatus(UserStatus.ACTIVE); // Staff is auto-active

        userRepository.save(userToCreate);
        log.info("New user created: {} ({})", userToCreate.getFullName(), userToCreate.getRole());

        return true;
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
        return userRepository.findByEmail(email)
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
                    .build());
        });

        userDto.setLastActivity(LocalDate.now()); // Placeholder
        userDto.setActivitiesCount(user.getAttendances().size());

        return userDto;
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
            Optional<User> existingUser = userRepository.findByDni(Integer.parseInt(newUser.getDni()));

            if (existingUser.isPresent()) {
                throw new EntityAlreadyExistsException("User already exists with DNI: " + newUser.getDni(),
                        "Api/User/createBatchClients");
            }

            User userToCreate = new User();
            userToCreate.setDni(Integer.parseInt(newUser.getDni()));
            userToCreate.setFirstName(newUser.getFirstName());
            userToCreate.setLastName(newUser.getLastName());
            userToCreate.setEmail(newUser.getEmail());
            userToCreate.setPhone(newUser.getPhone());
            userToCreate.setRole(newUser.getRole()); // Enforced as CLIENT by controller

            String initialAvatar = newUser.getFirstName().substring(0, 1).toUpperCase() +
                    newUser.getLastName().substring(0, 1).toUpperCase();
            userToCreate.setAvatar(initialAvatar);

            userToCreate.setJoinDate(LocalDate.now());
            userToCreate.setAddress(newUser.getAddress());
            userToCreate.setBirthDate(newUser.getBirthDate());
            userToCreate.setPassword(passwordEncoder.encode(newUser.getPassword()));
            userToCreate.setStatus(newUser.getStatus()); // Enforced as INACTIVE by controller

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

            if (payment.isEmpty() ||
                    payment.get().getExpiresAt().toLocalDate().isBefore(LocalDate.now())) {
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
                .weeklyActivityCount(getWeeklyActivityCount(client))
                .nextClass(getNextClass(client))
                .completedClassesCount(getCompletedClassesCount(client))
                .membershipStatus(client.getStatus())
                .remainingDays(getRemainingPlanDays(client))
                .build();
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
                .filter(attendance -> {
                    LocalDateTime activityDate = attendance.getActivity().getDate();
                    return activityDate.isAfter(startOfWeek) && activityDate.isBefore(endOfWeek)
                            && attendance.getAttendance().equals(AttendanceStatus.PRESENT);
                })
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
                .filter(attendance -> {
                    LocalDateTime activityDate = attendance.getActivity().getDate();
                    return activityDate.isAfter(startOfWeek) && activityDate.isBefore(endOfWeek)
                            && attendance.getAttendance().equals(AttendanceStatus.PRESENT);
                })
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
                .filter(attendance -> attendance.getAttendance().equals(AttendanceStatus.PRESENT))
                .count();
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
}
