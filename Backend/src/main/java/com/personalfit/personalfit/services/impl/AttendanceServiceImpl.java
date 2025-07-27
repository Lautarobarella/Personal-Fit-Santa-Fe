package com.personalfit.personalfit.services.impl;

import com.personalfit.personalfit.repository.IAttendanceRepository;
import com.personalfit.personalfit.services.IAttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AttendanceServiceImpl implements IAttendanceService {

    @Autowired
    private IAttendanceRepository attendanceRepository;

}
