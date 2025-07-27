package com.personalfit.personalfit.services.impl;

import com.personalfit.personalfit.dto.ActivityFormTypeDTO;
import com.personalfit.personalfit.exceptions.NoUserWithIdException;
import com.personalfit.personalfit.models.Activity;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.IActivityRepository;
import com.personalfit.personalfit.services.IActivityService;
import com.personalfit.personalfit.services.IUserService;
import com.personalfit.personalfit.utils.ActivityStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class ActivityServiceImpl implements IActivityService {

    @Autowired
    private IActivityRepository activityRepository;

    @Autowired
    private IUserService IUserService;

    public void createActivity(ActivityFormTypeDTO activity) {
        Optional<User> trainer = IUserService.getUserById(Long.parseLong(activity.getTrainerId()));
        if(trainer.isEmpty()) throw new NoUserWithIdException();

        Activity newActivity = Activity.builder()
                .name(activity.getName())
                .description(activity.getDescription())
                .slots(Integer.parseInt(activity.getMaxParticipants()))
                .date(LocalDateTime.of(activity.getDate(), activity.getTime()))
                .repeatEveryWeek(false)
                .duration(Integer.parseInt(activity.getDuration()))
                .status(ActivityStatus.active)
                .trainer(trainer.get())
                .build();

        try {
            activityRepository.save(newActivity);
        } catch (Exception e) {
            throw new RuntimeException("Error al guardar la actividad: " + e.getMessage(), e);
        }
    }
}
