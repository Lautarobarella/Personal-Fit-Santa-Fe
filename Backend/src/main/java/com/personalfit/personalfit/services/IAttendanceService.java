package com.personalfit.personalfit.services;

import com.personalfit.personalfit.repository.IAttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class IAttendanceService {

    @Autowired
    private IAttendanceRepository attendanceRepository;
}
