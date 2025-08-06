package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.dto.*;
import com.personalfit.personalfit.exceptions.NoUserWithIdException;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.services.IUserService;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private IUserService userService;

    @GetMapping("/fail")
    public ResponseEntity<Void> fail() {
        throw new NoUserWithIdException();
    }

    @PostMapping("/new")
    public ResponseEntity<Void> createUser(@Valid @RequestBody InCreateUserDTO user) {
        userService.createNewUser(user);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/findByDni")
    public ResponseEntity<User> findByDni(@Valid @RequestBody InFindByDniDTO userDni) {
        User user = userService.getUserByDni(userDni.getDni());
        return new ResponseEntity<>(user, HttpStatus.OK);
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<UserTypeDTO>> getAllUsers() {
        return new ResponseEntity<>(userService.getAllUsers(), HttpStatus.OK);
    }

    @GetMapping("/info/{id}")
    public ResponseEntity<UserTypeDTO> getUserInfo(@PathVariable Long id) {
        User user = userService.getUserById(id);
        UserTypeDTO userDto = userService.createUserDetailInfoDTO(user);
        return new ResponseEntity<>(userDto, HttpStatus.OK);
    }

    @GetMapping("/trainers")
    public ResponseEntity<List<UserTypeDTO>> getAllTrainers() {
        List<UserTypeDTO> trainers = userService.getAllTrainers();
        return new ResponseEntity<>(trainers, HttpStatus.OK);
    }

    // @PutMapping("/status/{id}")
    // public ResponseEntity<Void> updateUserStatus(@PathVariable Long id, String status){
    //     User user = userService.getUserById(id);
    //     userService.updateUserStatus(user, UserStatus.valueOf(status.toUpperCase()));
    //     return new ResponseEntity<>(HttpStatus.OK);
    // }

    @PutMapping("/lastAttendance/{dni}")
    public ResponseEntity<Void> updateLastAttendance(@PathVariable Integer dni) {
        userService.updateLastAttendanceByDni(dni);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Transactional
    @PostMapping("/batch")
    public ResponseEntity<Void> saveUsers(@Valid @RequestBody List<InCreateUserDTO> newUsers) {
        userService.saveAll(newUsers);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

}
