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
import org.springframework.scheduling.annotation.Scheduled;
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
    private IUserService userService;

    public void createActivity(ActivityFormTypeDTO activity) {
        User trainer = userService.getUserById(Long.parseLong(activity.getTrainerId()));

        Activity newActivity = Activity.builder()
                .name(activity.getName())
                .description(activity.getDescription())
                .slots(Integer.parseInt(activity.getMaxParticipants()))
                .date(LocalDateTime.of(activity.getDate(), activity.getTime()))
                .repeatEveryWeek(false)
                .duration(Integer.parseInt(activity.getDuration()))
                .status(ActivityStatus.active)
                .trainer(trainer)
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

        // Obtener todas las actividades entre el inicio y fin de semana
        List<Activity> allActivities = activityRepository.findByDateBetween(startOfWeek, endOfWeek);

        // Filtrar las actividades que estén dentro del rango [startOfWeek, endOfWeek]
        return allActivities.stream()
                .map(a -> {
                    return ActivityTypeDTO.builder()
                            .id(a.getId())
                            .name(a.getName())
                            .description(a.getDescription())
                            .location(a.getLocation())
                            .trainerName(a.getTrainer().getFullName())
                            .date(a.getDate())
                            .duration(a.getDuration())
                            .participants(a.getAttendances().stream().map(att -> att.getUser().getId()).collect(Collectors.toList()))
                            .maxParticipants(a.getSlots())
                            .currentParticipants(a.getAttendances().size())
                            .status(a.getStatus())
                            .build();
                })
                .collect(Collectors.toList());
    }

//    @Scheduled(cron = "0 0 3 * * *")
//    public void generateWeeklyActivities() { //TODO
//        LocalDateTime now = LocalDateTime.now();
//
//        List<Activity> activitiesToRepeat = activityRepository.findAll().stream()
//                .filter(a -> Boolean.TRUE.equals(a.getRepeatEveryWeek()))
//                .filter(a -> a.getDate().toLocalDate().isEqual(now.toLocalDate())) // se repite hoy
//                .toList();
//
//        for (Activity activity : activitiesToRepeat) {
//            Activity newActivity = Activity.builder()
//                    .name(activity.getName())
//                    .description(activity.getDescription())
//                    .slots(activity.getSlots())
//                    .date(activity.getDate().plusWeeks(1))
//                    .repeatEveryWeek(true)
//                    .duration(activity.getDuration())
//                    .status(ActivityStatus.active)
//                    .trainer(activity.getTrainer())
//                    .createdAt(LocalDateTime.now())
//                    .build();
//
//            activityRepository.save(newActivity);
//        }
//    }

}
