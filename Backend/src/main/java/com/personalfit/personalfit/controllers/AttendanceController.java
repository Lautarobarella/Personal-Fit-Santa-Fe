package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.repository.AttendanceRepository;
import com.personalfit.personalfit.services.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;
}
