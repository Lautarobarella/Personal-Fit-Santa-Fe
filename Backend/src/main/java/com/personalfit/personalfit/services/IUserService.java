package com.personalfit.personalfit.services;

import com.personalfit.personalfit.dto.InCreateUserDTO;
import com.personalfit.personalfit.dto.UserDetailInfoDTO;
import com.personalfit.personalfit.dto.UserTypeDTO;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.utils.UserStatus;

import java.util.List;

public interface IUserService {
    Boolean createNewUser(InCreateUserDTO newUser);
    Boolean updateUser(Long id, InCreateUserDTO user);
    Boolean deleteUser(Long id);
    User getUserByDni(Integer dni);
    List<UserTypeDTO> getAllUsers();
    Integer getUserAge(User user);
    User getUserById(Long id);
    UserDetailInfoDTO createUserDetailInfoDTO(User user);
    List<UserTypeDTO> getAllTrainers();
    Boolean saveAll(List<InCreateUserDTO> newUsers);
    void updateUserStatus(User user, UserStatus status);
    List<User> getAllAdmins();
    List<User> getAll(List<Long> id);
    void updateLastAttendanceByDni(Integer dni);
}
