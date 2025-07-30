package com.personalfit.personalfit.services.impl;

import com.personalfit.personalfit.dto.UserActivityDetailsDTO;
import com.personalfit.personalfit.dto.InCreateUserDTO;
import com.personalfit.personalfit.dto.PaymentTypeDTO;
import com.personalfit.personalfit.dto.UserDetailInfoDTO;
import com.personalfit.personalfit.dto.UserTypeDTO;
import com.personalfit.personalfit.exceptions.NoUserWithDniException;
import com.personalfit.personalfit.exceptions.NoUserWithIdException;
import com.personalfit.personalfit.exceptions.UserDniAlreadyExistsException;
import com.personalfit.personalfit.models.Payment;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.IUserRepository;
import com.personalfit.personalfit.services.IPaymentService;
import com.personalfit.personalfit.services.IUserService;
import com.personalfit.personalfit.utils.UserRole;
import com.personalfit.personalfit.utils.UserStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements IUserService {

    @Autowired
    private IUserRepository userRepository;

    public Boolean createNewUser(InCreateUserDTO newUser) {

        Optional<User> user = userRepository.findByDni(Integer.parseInt(newUser.getDni()));

        if (user.isPresent())
            throw new UserDniAlreadyExistsException();

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
        userToCreate.setPassword(newUser.getPassword());
        userToCreate.setStatus(newUser.getStatus());
        userRepository.save(userToCreate);

        return true;
    }

    public Boolean deleteUser(Long id) {
        Optional<User> user = userRepository.findById(id);

        if (user.isEmpty())
            throw new NoUserWithIdException();

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
            throw new NoUserWithDniException();
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
        return usersDto;
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
            throw new NoUserWithIdException();
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
        return users.stream().filter(u -> u.getRole().equals(UserRole.trainer))
                .map(u -> {
                    UserTypeDTO userDto = new UserTypeDTO(u);
                    Integer age = getUserAge(u);
                    userDto.setAge(age);
                    userDto.setLastActivity(LocalDate.now());
                    userDto.setActivitiesCount(u.getAttendances().size());
                    return userDto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public void updateUserStatus(User user, UserStatus status) {
        if (user == null)
            throw new NoUserWithIdException();

        user.setStatus(status);
        userRepository.save(user);
    }

    // batch function to save multiple users
    @Override
    public Boolean saveAll(List<InCreateUserDTO> newUsers) {

        for (InCreateUserDTO newUser : newUsers) {
            Optional<User> user = userRepository.findByDni(Integer.parseInt(newUser.getDni()));

            if (user.isPresent())
                throw new UserDniAlreadyExistsException();

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
            userToCreate.setPassword(newUser.getPassword());
            userToCreate.setStatus(newUser.getStatus());
            userRepository.save(userToCreate);
        }
        return true;
    }

}
