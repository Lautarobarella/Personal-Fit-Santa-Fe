package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.dto.*;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.services.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<Void> createUser(@Valid @RequestBody InCreateUserDTO user) {
        if( userService.createNewUser(user)) return new ResponseEntity<>(HttpStatus.CREATED);
        else return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteUser(@Valid @RequestBody InDeleteUserDTO user) {
        if( userService.deleteUser(user)) return new ResponseEntity<>(HttpStatus.OK);
        else return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @GetMapping("/findByDni")
    public ResponseEntity<User> findByDni(@Valid @RequestBody InFindByDniDTO userDni) {
        Optional<User> user = userService.getUserByDni(userDni.getDni());

        if(user.isPresent()) return new ResponseEntity<>(user.get(), HttpStatus.OK);
        else return new ResponseEntity<>(HttpStatus.NOT_FOUND);

    }

    @GetMapping("/getAll")
    public ResponseEntity<List<UserTypeDTO>> getAllUsers() {
        return new ResponseEntity<>(userService.getAllUsers(), HttpStatus.OK);
    }

    @GetMapping("/info/{id}")
    public ResponseEntity<UserTypeDTO> getUserInfo(@PathVariable Long id) {
        Optional<User> user = userService.getUserById(id);
        if(user.isPresent()) {
            UserTypeDTO userDto = userService.createUserDetailInfoDTO(user.get());
            return new ResponseEntity<>(userDto, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }


}
