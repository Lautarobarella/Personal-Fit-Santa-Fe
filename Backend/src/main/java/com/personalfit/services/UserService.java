package com.personalfit.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.personalfit.dto.User.CreateUserDTO;
import com.personalfit.dto.User.UserActivityDetailsDTO;
import com.personalfit.dto.User.UserDetailInfoDTO;
import com.personalfit.dto.User.UserTypeDTO;
import com.personalfit.enums.PaymentStatus;
import com.personalfit.enums.UserRole;
import com.personalfit.enums.UserStatus;
import com.personalfit.exceptions.EntityAlreadyExistsException;
import com.personalfit.exceptions.EntityNotFoundException;
import com.personalfit.models.Payment;
import com.personalfit.models.User;
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
}
