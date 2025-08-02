package com.personalfit.personalfit.services.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.personalfit.personalfit.repository.IAttendanceRepository;
import com.personalfit.personalfit.services.IAttendanceService;

@Service
public class AttendanceServiceImpl implements IAttendanceService {

    @Autowired
    private IAttendanceRepository attendanceRepository;

    @Override
    public void markAttendance(String userId, String activityId, String status) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'markAttendance'");
    }

}