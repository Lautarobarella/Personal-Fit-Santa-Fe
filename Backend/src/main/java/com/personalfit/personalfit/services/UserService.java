package com.personalfit.personalfit.services;

import com.personalfit.personalfit.dto.CreateUserDTO;
import com.personalfit.personalfit.dto.DeleteUserDTO;
import com.personalfit.personalfit.exceptions.NoUserWithDniException;
import com.personalfit.personalfit.exceptions.UserDniAlreadyExistsException;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.IUserRepository;
import com.personalfit.personalfit.utils.UserRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private IUserRepository userRepository;

    public Boolean createNewUser(CreateUserDTO newUser) {
        Optional<User> user = userRepository.findByDni(newUser.getDni());

        if (user.isPresent()) throw new UserDniAlreadyExistsException();

        User userToCreate = new User();
        userToCreate.setDni(newUser.getDni());
        userToCreate.setFirstName(newUser.getFirstName());
        userToCreate.setLastName(newUser.getLastName());
        userToCreate.setEmail(newUser.getEmail());
        userToCreate.setPhoneNumber(newUser.getPhoneNumber());
        userToCreate.setRole(UserRole.Client);
        userRepository.save(userToCreate);

        return true;
    }

    public Boolean deleteUser(DeleteUserDTO userToDelete) {
        Optional<User> user = userRepository.findByDni(userToDelete.getDni());

        if (!user.isPresent()) throw new NoUserWithDniException();

        userRepository.delete(user.get());

        return true;
    }

    public Optional<User> getUserByDni(Integer dni) {

        return userRepository.findByDni(dni);

    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

}
