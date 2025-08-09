package com.personalfit.personalfit.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.personalfit.dto.InCreateUserDTO;
import com.personalfit.personalfit.dto.InFindByDniDTO;
import com.personalfit.personalfit.dto.UserTypeDTO;
import com.personalfit.personalfit.exceptions.NoUserWithIdException;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.services.IUserService;

import jakarta.validation.Valid;


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
    public ResponseEntity<Map<String, Object>> createUser(@Valid @RequestBody InCreateUserDTO user) {
        userService.createNewUser(user);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Usuario creado exitosamente");
        response.put("success", true);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Usuario eliminado exitosamente");
        response.put("success", true);
        response.put("userId", id);
        return ResponseEntity.ok(response);
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
    public ResponseEntity<Map<String, Object>> updateLastAttendance(@PathVariable Integer dni) {
        userService.updateLastAttendanceByDni(dni);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Última asistencia actualizada exitosamente");
        response.put("success", true);
        response.put("dni", dni);
        return ResponseEntity.ok(response);
    }

    @Transactional
    @PostMapping("/batch")
    public ResponseEntity<Void> saveUsers(@Valid @RequestBody List<InCreateUserDTO> newUsers) {
        userService.saveAll(newUsers);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

}
