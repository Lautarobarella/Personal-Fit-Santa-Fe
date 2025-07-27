package com.personalfit.personalfit.services.impl;

import com.personalfit.personalfit.dto.*;
import com.personalfit.personalfit.exceptions.NoUserWithIdException;
import com.personalfit.personalfit.models.Activity;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.IActivityRepository;
import com.personalfit.personalfit.services.IActivityService;
import com.personalfit.personalfit.services.IUserService;
import com.personalfit.personalfit.utils.ActivityStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
                .createdAt(LocalDateTime.now())
                .build();

        try {
            activityRepository.save(newActivity);
        } catch (Exception e) {
            throw new RuntimeException("Error al guardar la actividad: " + e.getMessage(), e);
        }
    }

    public List<ActivityTypeDTO> getAllActivitiesTypeDto() {
        List<Activity> activities = activityRepository.findAll();
        return activities.stream()
                .map(activity -> ActivityTypeDTO.builder()
                        .id(activity.getId())
                        .name(activity.getName())
                        .description(activity.getDescription())
                        .location(activity.getLocation())
                        .trainerName(activity.getTrainer().getFullName())
                        .date(activity.getDate())
                        .duration(activity.getDuration())
                        .participants(activity.getAttendances().stream().map(a -> a.getUser().getId()).collect(Collectors.toList()))
                        .maxParticipants(activity.getSlots())
                        .currentParticipants(activity.getAttendances().size())
                        .status(activity.getStatus())
                        .build())
                .toList();
    }

    public ActivityDetailInfoDTO getActivityDetailInfo(Long id) {
        Optional<Activity> activity = activityRepository.findById(id);
        if (activity.isEmpty()) {
            throw new RuntimeException("Activity not found with id: " + id);
        }

        Activity act = activity.get();
        return ActivityDetailInfoDTO.builder()
                .id(act.getId())
                .name(act.getName())
                .description(act.getDescription())
                .location(act.getLocation())
                .trainerName(act.getTrainer().getFullName())
                .date(act.getDate())
                .duration(act.getDuration())
                .maxParticipants(act.getSlots())
                .participants(act.getAttendances().stream().map(a -> {
                    return ActivityUserDetailDTO.builder()
                            .id(a.getUser().getId())
                            .firstName(a.getUser().getFirstName())
                            .lastName(a.getUser().getLastName())
                            .createdAt(act.getDate())
                            .status(a.getUser().getStatus())
                            .build();
                }).collect(Collectors.toList()))
                .currentParticipants(act.getAttendances().size())
                .status(act.getStatus())
                .build();
    }

    public List<ActivityTypeDTO> getAllActivitiesTypeDtoAtWeek(LocalDate date) {

        // Obtener el inicio de la semana: domingo (incluido)
        LocalDate startOfWeekDate = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
        LocalDateTime startOfWeek = startOfWeekDate.atStartOfDay(); // 00:00:00

        // Obtener fin de semana: sábado (incluido)
        LocalDate endOfWeekDate = date.with(TemporalAdjusters.nextOrSame(DayOfWeek.SATURDAY));
        LocalDateTime endOfWeek = endOfWeekDate.atTime(LocalTime.MAX); // 23:59:59.999999999

        // Obtener todas las actividades
        List<ActivityTypeDTO> allActivities = getAllActivitiesTypeDto();

        // Filtrar las actividades que estén dentro del rango [startOfWeek, endOfWeek]
        return allActivities.stream()
                .filter(a -> {
                    LocalDateTime activityDate = a.getDate();
                    return ( !activityDate.isBefore(startOfWeek) ) && ( !activityDate.isAfter(endOfWeek) );
                })
                .collect(Collectors.toList());
    }

}
