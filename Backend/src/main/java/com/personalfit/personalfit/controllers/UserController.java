package com.personalfit.personalfit.controllers;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.personalfit.dto.InCreateUserDTO;
import com.personalfit.personalfit.dto.InFindByDniDTO;
import com.personalfit.personalfit.dto.UserTypeDTO;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.services.IUserService;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

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

    @GetMapping("/trainers")
    public ResponseEntity<List<UserTypeDTO>> getAllTrainers() {
        List<UserTypeDTO> trainers = IUserService.getAllTrainers();
        return new ResponseEntity<>(trainers, HttpStatus.OK);
    }

    // @PostMapping("/batch")
    // public ResponseEntity<List<Producto>> saveProductos(@RequestBody
    // List<Producto> productos) {
    // List<Producto> savedProductos = productoService.saveAll(productos);
    // return ResponseEntity.ok(savedProductos);
    // }

    @Transactional
    @PostMapping("/batch")
    public ResponseEntity<Void> saveUsers(@Valid @RequestBody List<InCreateUserDTO> newUsers) {
        IUserService.saveAll(newUsers);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }
}
