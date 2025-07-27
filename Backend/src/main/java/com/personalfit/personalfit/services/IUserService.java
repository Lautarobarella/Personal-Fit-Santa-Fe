package com.personalfit.personalfit.services;

import com.personalfit.personalfit.dto.InCreateUserDTO;
import com.personalfit.personalfit.dto.UserDetailInfoDTO;
import com.personalfit.personalfit.dto.UserTypeDTO;
import com.personalfit.personalfit.models.User;

import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;

public interface IUserService {
    Boolean createNewUser(InCreateUserDTO newUser);
    Boolean deleteUser(Long id);
    User getUserByDni(Integer dni);
    List<UserTypeDTO> getAllUsers();
    Integer getUserAge(User user);
    Optional<User> getUserById(Long id);
    UserDetailInfoDTO createUserDetailInfoDTO(User user);
    List<UserTypeDTO> getAllTrainers();
    Boolean saveAll(List<InCreateUserDTO> newUsers);
    
}
