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
import org.springframework.security.crypto.password.PasswordEncoder;
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

    @Autowired
    private PasswordEncoder passwordEncoder;

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
        userToCreate.setPassword(passwordEncoder.encode(newUser.getPassword())); // Encriptar contraseña
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

        return usersDto.stream()
                .filter(u -> !u.getRole().equals(UserRole.admin))
                .collect(Collectors.toList());
    }

    public User getUserById(Long id) {
        Optional<User> user = userRepository.findById(id);
        if (!user.isPresent())
            throw new NoUserWithIdException();
        return user.get();
    }

    public UserDetailInfoDTO createUserDetailInfoDTO(User user) {
        List<UserActivityDetailsDTO> userActivityDetailsDTOList = new ArrayList<>();
        List<PaymentTypeDTO> paymentTypeDTOList = new ArrayList<>();

        user.getAttendances().stream().forEach(attendance -> {
            UserActivityDetailsDTO userActivityDetailsDTO = new UserActivityDetailsDTO();
            userActivityDetailsDTO.setId(attendance.getActivity().getId());
            userActivityDetailsDTO.setName(attendance.getActivity().getName());
            userActivityDetailsDTO.setTrainerName(attendance.getActivity().getTrainer().getFullName());
            userActivityDetailsDTO.setDate(attendance.getActivity().getDate());
            userActivityDetailsDTO.setActivityStatus(attendance.getActivity().getStatus());
            userActivityDetailsDTO.setClientStatus(attendance.getAttendance());
            userActivityDetailsDTOList.add(userActivityDetailsDTO);
        });

        user.getPayments().stream().forEach(payment -> {
            PaymentTypeDTO paymentTypeDTO = new PaymentTypeDTO();
            paymentTypeDTO.setId(payment.getId());
            paymentTypeDTO.setClientId(payment.getUser().getId());
            paymentTypeDTO.setClientName(payment.getUser().getFullName());
            paymentTypeDTO.setAmount(payment.getAmount());
            paymentTypeDTO.setCreatedAt(payment.getCreatedAt());
            paymentTypeDTO.setExpiresAt(payment.getExpiresAt());
            paymentTypeDTO.setStatus(payment.getStatus());
            paymentTypeDTO.setVerifiedAt(payment.getVerifiedAt());
            paymentTypeDTO.setMethod(payment.getMethod());
            paymentTypeDTO.setRejectionReason(payment.getRejectionReason());
            paymentTypeDTO.setReceiptId(payment.getReceiptId());
            paymentTypeDTO.setReceiptUrl(payment.getReceiptUrl());
            paymentTypeDTOList.add(paymentTypeDTO);
        });

        return new UserDetailInfoDTO(user, userActivityDetailsDTOList, paymentTypeDTOList);
    }

    public List<UserTypeDTO> getAllTrainers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .filter(user -> user.getRole().equals(UserRole.trainer))
                .map(UserTypeDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public void updateUserStatus(User user, UserStatus status) {
        user.setStatus(status);
        userRepository.save(user);
    }

    @Override
    public Boolean saveAll(List<InCreateUserDTO> newUsers) {
        try {
            for (InCreateUserDTO newUser : newUsers) {
                createNewUser(newUser);
            }
            return true;
        } catch (Exception e) {
            System.out.println("Error saving users: " + e.getMessage());
            return false;
        }
    }

    public Integer getUserAge(User user) {
        if (user.getBirthDate() == null) {
            return null;
        }
        return user.getAge();
    }
}
