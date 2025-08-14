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
import com.personalfit.repository.ActivityRepository;
import com.personalfit.repository.AttendanceRepository;
import com.personalfit.repository.PaymentRepository;
import com.personalfit.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

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
    private ActivityRepository activityRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Boolean createNewUser(CreateUserDTO newUser) {

        Optional<User> user = userRepository.findByDni(Integer.parseInt(newUser.getDni()));

        if (user.isPresent())
            throw new EntityAlreadyExistsException("Ya existe un usuario con DNI: " + newUser.getDni(),
                    "Api/User/createNewUser");

        User userToCreate = new User();
        userToCreate.setDni(Integer.parseInt(newUser.getDni()));
        userToCreate.setFirstName(newUser.getFirstName());
        userToCreate.setLastName(newUser.getLastName());
        userToCreate.setEmail(newUser.getEmail());
        userToCreate.setPhone(newUser.getPhone());
        userToCreate.setRole(newUser.getRole());
        userToCreate.setAvatar(newUser.getFirstName().substring(0, 1).toUpperCase() +
                newUser.getLastName().substring(0, 1).toUpperCase()); // Setea las iniciales en mayúsculas
        userToCreate.setJoinDate(LocalDate.now());
        userToCreate.setAddress(newUser.getAddress());
        userToCreate.setBirthDate(newUser.getBirthDate());
        userToCreate.setPassword(passwordEncoder.encode(newUser.getPassword())); // Encriptar contraseña
        if (userToCreate.getRole().equals(UserRole.CLIENT))
            userToCreate.setStatus(UserStatus.INACTIVE);
        else
            userToCreate.setStatus(UserStatus.ACTIVE);
        userRepository.save(userToCreate);

        return true;
    }

    public Boolean deleteUser(Long id) {
        Optional<User> user = userRepository.findById(id);

        if (user.isEmpty())
            throw new EntityNotFoundException("Usuario con ID: " + id + " no encontrado", "Api/User/deleteUser");

        try {
            userRepository.delete(user.get());
        } catch (Exception e) {
            System.out.println("Error deleting user: " + e.getMessage());
            return false;
        }

        return true;
    }

    public User getUserByDni(Integer dni) {
        Optional<User> user = userRepository.findByDni(dni);
        if (!user.isPresent())
            throw new EntityNotFoundException("Usuario con DNI: " + dni + " no encontrado", "Api/User/getUserByDni");
        return user.get();
    }

    public List<UserTypeDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserTypeDTO> usersDto = new ArrayList<>();

        users.stream().forEach(user -> {
            UserTypeDTO newUserDto = new UserTypeDTO(user);
            Integer age = getUserAge(user);
            newUserDto.setAge(age);
            newUserDto.setLastActivity(LocalDate.now());
            newUserDto.setActivitiesCount(user.getAttendances().size());
            usersDto.add(new UserTypeDTO(user));

        });

        return usersDto.stream()
                .filter(u -> !u.getRole().equals(UserRole.ADMIN))
                .collect(Collectors.toList());
    }

    public Integer getUserAge(User user) {
        if (user.getBirthDate() == null)
            return null; // Si no tiene fecha de nacimiento, no se puede calcular la edad

        LocalDate today = LocalDate.now();
        Integer age = today.getYear() - user.getBirthDate().getYear();

        // Ajustar si el cumpleaños aún no ha ocurrido este año
        if (today.getDayOfYear() < user.getBirthDate().getDayOfYear()) {
            age--;
        }

        return age;
    }

    public User getUserById(Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isEmpty())
            throw new EntityNotFoundException("Usuario con ID: " + id + " no encontrado", "Api/User/getUserById");
        return user.get();
    }

    public User getUserByEmail(String email) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isEmpty())
            throw new EntityNotFoundException("Usuario con email: " + email + " no encontrado", "Api/User/getUserByEmail");
        return user.get();
    }

    public UserDetailInfoDTO createUserDetailInfoDTO(User user) {
        UserDetailInfoDTO userDto = new UserDetailInfoDTO(user);
        Integer age = getUserAge(user);
        userDto.setAge(age);

        user.getAttendances().stream().forEach(attendance -> {
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

        userDto.setLastActivity(LocalDate.now()); // Aca deberia filtrar todas las actividades y quedarme con la ultima
        userDto.setActivitiesCount(user.getAttendances().size());

        return userDto;
    }

    public List<UserTypeDTO> getAllTrainers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .filter(user -> user.getRole().equals(UserRole.TRAINER))
                .map(UserTypeDTO::new)
                .collect(Collectors.toList());
    }

    public void updateUserStatus(User user, UserStatus status) {
        if (user == null)
            throw new EntityNotFoundException("Usuario no puede ser null", "Api/User/updateUserStatus");

        user.setStatus(status);
        userRepository.save(user);
    }

    public List<User> getAllAdmins() {
        return userRepository.findAllByRole(UserRole.ADMIN);
    }

    public List<User> getAll(List<Long> id) {
        return userRepository.findByIdIn(id);
    }

    public void updateLastAttendanceByDni(Integer dni) {
        Optional<User> user = userRepository.findByDni(dni);
        if (user.isEmpty())
            throw new EntityNotFoundException("Usuario con DNI: " + dni + " no encontrado",
                    "Api/User/updateLastAttendanceByDni");

        user.get().setLastAttendance(LocalDateTime.now());
        userRepository.save(user.get());
    }

    // batch function to create multiple clients (similar to createNewUser logic)
    public Integer createBatchClients(List<CreateUserDTO> newUsers) {
        List<User> usersToSave = new ArrayList<>();
        
        for (CreateUserDTO newUser : newUsers) {
            // Verificar si ya existe un usuario con este DNI
            Optional<User> existingUser = userRepository.findByDni(Integer.parseInt(newUser.getDni()));
            
            if (existingUser.isPresent()) {
                throw new EntityAlreadyExistsException("Ya existe un usuario con DNI: " + newUser.getDni(),
                        "Api/User/createBatchClients");
            }

            // Crear nuevo usuario siguiendo la misma lógica que createNewUser
            User userToCreate = new User();
            userToCreate.setDni(Integer.parseInt(newUser.getDni()));
            userToCreate.setFirstName(newUser.getFirstName());
            userToCreate.setLastName(newUser.getLastName());
            userToCreate.setEmail(newUser.getEmail());
            userToCreate.setPhone(newUser.getPhone());
            userToCreate.setRole(newUser.getRole()); // Ya viene forzado como CLIENT desde el controller
            userToCreate.setAvatar(newUser.getFirstName().substring(0, 1).toUpperCase() +
                    newUser.getLastName().substring(0, 1).toUpperCase()); // Setea las iniciales en mayúsculas
            userToCreate.setJoinDate(LocalDate.now());
            userToCreate.setAddress(newUser.getAddress());
            userToCreate.setBirthDate(newUser.getBirthDate());
            userToCreate.setPassword(passwordEncoder.encode(newUser.getPassword())); // Encriptar contraseña
            userToCreate.setStatus(newUser.getStatus()); // Ya viene forzado como INACTIVE desde el controller
            
            usersToSave.add(userToCreate);
        }
        
        // Guardar todos los usuarios en lote para mejor rendimiento
        List<User> savedUsers = userRepository.saveAll(usersToSave);
        return savedUsers.size();
    }

    @Scheduled(cron = "0 0 3 * * ?")
    public void userStatusDailyCheck() {
        log.info("Daily user status checking started at {}", LocalDateTime.now());
        List<User> users = userRepository.findAllByStatus(UserStatus.ACTIVE);
        List<User> toUpdate = new ArrayList<>();
        users.stream().forEach(u -> {
            if (u.getRole().equals(UserRole.TRAINER) || u.getRole().equals(UserRole.ADMIN))
                return;

            Optional<Payment> payment = paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(u,
                    PaymentStatus.PAID);

            if (payment.isEmpty() ||
                    payment.get().getExpiresAt().toLocalDate().isBefore(LocalDate.now())) {
                u.setStatus(UserStatus.INACTIVE);
                toUpdate.add(u);
                log.info("User {} has been set to inactive due to expired payment.", u.getFullName());
            }
        });
        if (!toUpdate.isEmpty()) {
            userRepository.saveAll(toUpdate);
            // TODO: enviar notificación a usuarios y admins
            notificationService.createPaymentExpiredNotification(toUpdate, getAllAdmins());
        }
    }

    @Scheduled(cron = "0 1 0 * * ?")
    public void userBirthdayCheck() {
        log.info("Daily user birthday checking started at {}", LocalDateTime.now());
        List<User> users = userRepository.findAllByBirthDate(LocalDate.now());
        log.info("Found {} users with birthday today.", users.size());

        // TODO logica para enviar notificaciones a los usuarios y al admin del
        // cumpleañero
        notificationService.createBirthdayNotification(users, getAllAdmins());
    }

    @Scheduled(cron = "0 45 2 * * ?")
    public void userAttendanceCheck() {
        log.info("Daily user attendance checking started at {}", LocalDateTime.now());
        LocalDateTime dateLimit = LocalDateTime.now().minusDays(7); // 1 semana de inasistencias
        // List<User> users =
        // userRepository.findActiveUsersWithLastAttendanceBefore(UserStatus.active,
        // dateLimit); // Este le envia todos los dias
        List<User> users = userRepository.findActiveUsersWithLastAttendanceOn(UserStatus.ACTIVE,
                dateLimit.toLocalDate()); // Este le envia solo a los que cumplen 4 dias hoy (es decir, 1 vez)

        notificationService.createAttendanceWarningNotification(users, getAllAdmins());

    }

    /**
     * Obtiene las estadísticas completas de un cliente para el dashboard
     * @param clientId ID del cliente
     * @return ClientStatsDTO con todas las estadísticas
     */
    public ClientStatsDTO getClientStats(Long clientId) {
        User client = getUserById(clientId);
        if (!client.getRole().equals(UserRole.CLIENT)) {
            throw new IllegalArgumentException("El usuario no es un cliente");
        }

        return ClientStatsDTO.builder()
                .weeklyActivityCount(getWeeklyActivityCount(client))
                .nextClass(getNextClass(client))
                .completedClassesCount(getCompletedClassesCount(client))
                .membershipStatus(client.getStatus())
                .build();
    }

    /**
     * Obtiene la cantidad de actividades en las que el cliente se inscribió y estuvo presente esta semana
     * @param client Usuario cliente
     * @return Cantidad de actividades de la semana
     */
    public Integer getWeeklyActivityCount(User client) {
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate sunday = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        
        LocalDateTime startOfWeek = monday.atStartOfDay();
        LocalDateTime endOfWeek = sunday.atTime(23, 59, 59);

        List<Attendance> weeklyAttendances = attendanceRepository.findByUser(client).stream()
                .filter(attendance -> {
                    LocalDateTime activityDate = attendance.getActivity().getDate();
                    return activityDate.isAfter(startOfWeek) && activityDate.isBefore(endOfWeek) 
                           && attendance.getAttendance().equals(AttendanceStatus.PRESENT);
                })
                .collect(Collectors.toList());

        return weeklyAttendances.size();
    }

    /**
     * Obtiene la cantidad de actividades en las que el cliente se inscribió y estuvo presente esta semana para una fecha específica
     * @param client Usuario cliente
     * @param weekStartDate Fecha de inicio de la semana (lunes)
     * @return Cantidad de actividades de esa semana
     */
    public Integer getWeeklyActivityCount(User client, LocalDate weekStartDate) {
        LocalDate monday = weekStartDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate sunday = monday.plusDays(6);
        
        LocalDateTime startOfWeek = monday.atStartOfDay();
        LocalDateTime endOfWeek = sunday.atTime(23, 59, 59);

        List<Attendance> weeklyAttendances = attendanceRepository.findByUser(client).stream()
                .filter(attendance -> {
                    LocalDateTime activityDate = attendance.getActivity().getDate();
                    return activityDate.isAfter(startOfWeek) && activityDate.isBefore(endOfWeek) 
                           && attendance.getAttendance().equals(AttendanceStatus.PRESENT);
                })
                .collect(Collectors.toList());

        return weeklyAttendances.size();
    }

    /**
     * Obtiene la próxima clase más cercana en la que el cliente está inscrito
     * @param client Usuario cliente
     * @return NextClassDTO con información de la próxima clase o null si no hay ninguna
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
     * Obtiene el total de clases completadas (inscrito y presente) del cliente
     * @param client Usuario cliente
     * @return Cantidad total de clases completadas
     */
    public Integer getCompletedClassesCount(User client) {
        return (int) attendanceRepository.findByUser(client).stream()
                .filter(attendance -> attendance.getAttendance().equals(AttendanceStatus.PRESENT))
                .count();
    }

    /**
     * Obtiene el estado de membresía del cliente
     * @param client Usuario cliente
     * @return UserStatus del cliente
     */
    public UserStatus getMembershipStatus(User client) {
        return client.getStatus();
    }

    /**
     * Actualiza la contraseña de un usuario
     * @param userId ID del usuario
     * @param currentPassword Contraseña actual
     * @param newPassword Nueva contraseña
     * @throws EntityNotFoundException Si el usuario no existe
     * @throws IllegalArgumentException Si la contraseña actual es incorrecta
     */
    public void updatePassword(Long userId, String currentPassword, String newPassword) {
        log.info("Updating password for user ID: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId, "UserService/updatePassword"));
        
        // Verificar que la contraseña actual sea correcta
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            log.warn("Password update failed for user ID: {} - Invalid current password", userId);
            throw new IllegalArgumentException("Contraseña actual incorrecta");
        }
        
        // Verificar que la nueva contraseña sea diferente
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            log.warn("Password update failed for user ID: {} - New password same as current", userId);
            throw new IllegalArgumentException("New password must be different from current password");
        }
        
        // Actualizar la contraseña
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        log.info("Password updated successfully for user ID: {}", userId);
    }
}
