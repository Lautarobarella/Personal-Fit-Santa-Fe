package com.personalfit.personalfit.services;

import com.personalfit.personalfit.repository.IActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ActivityService {

    @Autowired
    private IActivityRepository activityRepository;

}
