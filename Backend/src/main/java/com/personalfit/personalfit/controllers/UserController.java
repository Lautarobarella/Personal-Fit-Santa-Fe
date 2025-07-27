package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.dto.*;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.services.IUserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private IUserService IUserService;

    @PostMapping("/new")
    public ResponseEntity<Void> createUser(@Valid @RequestBody InCreateUserDTO user) {
        IUserService.createNewUser(user);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        IUserService.deleteUser(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/findByDni")
    public ResponseEntity<User> findByDni(@Valid @RequestBody InFindByDniDTO userDni) {
        User user = IUserService.getUserByDni(userDni.getDni());
        return new ResponseEntity<>(user, HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<UserTypeDTO>> getAllUsers() {
        return new ResponseEntity<>(IUserService.getAllUsers(), HttpStatus.OK);
    }

    @GetMapping("/info/{id}")
    public ResponseEntity<UserTypeDTO> getUserInfo(@PathVariable Long id) {
        Optional<User> user = IUserService.getUserById(id);
        UserTypeDTO userDto = IUserService.createUserDetailInfoDTO(user.get());
        return new ResponseEntity<>(userDto, HttpStatus.OK);
    }


}
