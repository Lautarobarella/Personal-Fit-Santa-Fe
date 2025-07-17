package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.repository.UserRepository;
import com.personalfit.personalfit.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

}
