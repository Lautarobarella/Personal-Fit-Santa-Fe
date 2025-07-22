package com.personalfit.personalfit.services;

import com.personalfit.personalfit.dto.InCreateUserDTO;
import com.personalfit.personalfit.dto.InDeleteUserDTO;
import com.personalfit.personalfit.exceptions.NoUserWithDniException;
import com.personalfit.personalfit.exceptions.UserDniAlreadyExistsException;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.IUserRepository;
import com.personalfit.personalfit.utils.UserRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private IUserRepository userRepository;

    public Boolean createNewUser(InCreateUserDTO newUser) {
        Optional<User> user = userRepository.findByDni(newUser.getDni());

        if (user.isPresent()) throw new UserDniAlreadyExistsException();

        User userToCreate = new User();
        userToCreate.setDni(newUser.getDni());
        userToCreate.setFirstName(newUser.getFirstName());
        userToCreate.setLastName(newUser.getLastName());
        userToCreate.setEmail(newUser.getEmail());
        userToCreate.setPhoneNumber(newUser.getPhoneNumber());
        userToCreate.setRole(UserRole.Client);
        userToCreate.setAvatarName(newUser.getFirstName().substring(0, 1).toUpperCase() +
                newUser.getLastName().substring(0, 1).toUpperCase()); // Setea las iniciales en mayúsculas
        userToCreate.setJoinDate(LocalDate.now());
        userToCreate.setAddress(newUser.getAddress());
        userToCreate.setBirthDate(newUser.getBirthDate());
        userRepository.save(userToCreate);

        return true;
    }

    public Boolean deleteUser(InDeleteUserDTO userToDelete) {
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

    public Integer getUserAge(User user) {
        if (user.getBirthDate() == null) return null; // Si no tiene fecha de nacimiento, no se puede calcular la edad

        LocalDate today = LocalDate.now();
        Integer age = today.getYear() - user.getBirthDate().getYear();

        // Ajustar si el cumpleaños aún no ha ocurrido este año
        if (today.getDayOfYear() < user.getBirthDate().getDayOfYear()) {
            age--;
        }

        return age;
    }

}
