package com.personalfit.personalfit.services.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.personalfit.personalfit.dto.*;
import com.personalfit.personalfit.exceptions.NoActivityWithIdException;
import com.personalfit.personalfit.exceptions.NoUserWithIdException;
import com.personalfit.personalfit.models.Activity;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.IActivityRepository;
import com.personalfit.personalfit.services.IActivityService;
import com.personalfit.personalfit.services.IAttendanceService;
import com.personalfit.personalfit.services.IUserService;
import com.personalfit.personalfit.utils.ActivityStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ActivityServiceImpl implements IActivityService {

    @Autowired
    private IActivityRepository activityRepository;

    @Autowired
    private IUserService userService;

    @Autowired
    private IAttendanceService attendanceService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public void createActivity(ActivityFormTypeDTO activity) {
        User trainer = userService.getUserById(Long.parseLong(activity.getTrainerId()));

        // Si hay un horario semanal, crear múltiples actividades
        if (activity.getWeeklySchedule() != null && !activity.getWeeklySchedule().isEmpty()) {
            createMultipleActivities(activity, trainer);
        } else {
            // Crear una sola actividad usando la fecha actual
            LocalDate currentDate = LocalDate.now();
            LocalTime activityTime = activity.getTime() != null ? activity.getTime() : LocalTime.of(9, 0); // Default 9:00 AM

            Activity newActivity = Activity.builder()
                    .name(activity.getName())
                    .description(activity.getDescription())
                    .location(activity.getLocation())
                    .slots(Integer.parseInt(activity.getMaxParticipants()))
                    .date(LocalDateTime.of(currentDate, activityTime))
                    .repeatEveryWeek(activity.getIsRecurring() != null ? activity.getIsRecurring() : false)
                    .duration(Integer.parseInt(activity.getDuration()))
                    .status(ActivityStatus.active)
                    .trainer(trainer)
                    .createdAt(LocalDateTime.now())
                    .isRecurring(activity.getIsRecurring())
                    .build();

            try {
                activityRepository.save(newActivity);
            } catch (Exception e) {
                throw new RuntimeException("Error al guardar la actividad: " + e.getMessage(), e);
            }
        }
    }

    private void createMultipleActivities(ActivityFormTypeDTO activity, User trainer) {
        LocalDate baseDate = LocalDate.now(); // Usar fecha actual como base
        LocalTime activityTime = activity.getTime() != null ? activity.getTime() : LocalTime.of(9, 0); // Default 9:00 AM

        // Días de la semana: 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado, 6=Domingo
        DayOfWeek[] daysOfWeek = {
            DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY
        };

        for (int i = 0; i < activity.getWeeklySchedule().size(); i++) {
            if (activity.getWeeklySchedule().get(i)) {
                // Calcular la fecha para este día de la semana
                LocalDate activityDate = calculateNextDateForDay(baseDate, daysOfWeek[i]);

                Activity newActivity = Activity.builder()
                        .name(activity.getName())
                        .description(activity.getDescription())
                        .location(activity.getLocation())
                        .slots(Integer.parseInt(activity.getMaxParticipants()))
                        .date(LocalDateTime.of(activityDate, activityTime))
                        .repeatEveryWeek(activity.getIsRecurring() != null ? activity.getIsRecurring() : false)
                        .duration(Integer.parseInt(activity.getDuration()))
                        .status(ActivityStatus.active)
                        .trainer(trainer)
                        .createdAt(LocalDateTime.now())
                        .isRecurring(activity.getIsRecurring())
                        .build();

                try {
                    activityRepository.save(newActivity);
                } catch (Exception e) {
                    throw new RuntimeException("Error al guardar la actividad para el día " + (i + 1) + ": " + e.getMessage(), e);
                }
            }
        }
    }

    private LocalDate calculateNextDateForDay(LocalDate baseDate, DayOfWeek targetDay) {
        // Si la fecha base es el día objetivo, usar esa fecha
        if (baseDate.getDayOfWeek() == targetDay) {
            return baseDate;
        }

        // Encontrar el próximo día de la semana objetivo
        LocalDate nextDate = baseDate.with(TemporalAdjusters.next(targetDay));

        // Si la fecha resultante es más de 7 días en el futuro, usar la fecha actual
        if (nextDate.isAfter(baseDate.plusDays(7))) {
            return baseDate.with(TemporalAdjusters.nextOrSame(targetDay));
        }

        return nextDate;
    }

    public void updateActivity(Long id, ActivityFormTypeDTO activity) {
        Activity existingActivity = activityRepository.findById(id)
                .orElseThrow(() -> new NoActivityWithIdException("Activity not found with id: " + id));

        User trainer = userService.getUserById(Long.parseLong(activity.getTrainerId()));

        // Actualizar fecha y hora si se proporcionan
        LocalDateTime newDateTime = null;
        if (activity.getDate() != null && activity.getTime() != null) {
            newDateTime = LocalDateTime.of(activity.getDate(), activity.getTime());
        } else if (activity.getDate() != null) {
            // Si solo se proporciona la fecha, mantener la hora actual
            newDateTime = LocalDateTime.of(activity.getDate(), existingActivity.getDate().toLocalTime());
        } else if (activity.getTime() != null) {
            // Si solo se proporciona la hora, mantener la fecha actual
            newDateTime = LocalDateTime.of(existingActivity.getDate().toLocalDate(), activity.getTime());
        }

        existingActivity.setName(activity.getName());
        existingActivity.setDescription(activity.getDescription());
        existingActivity.setLocation(activity.getLocation());
        existingActivity.setSlots(Integer.parseInt(activity.getMaxParticipants()));
        existingActivity.setDuration(Integer.parseInt(activity.getDuration()));
        existingActivity.setTrainer(trainer);
        existingActivity.setIsRecurring(activity.getIsRecurring());

        // Actualizar la fecha solo si se proporcionó una nueva
        if (newDateTime != null) {
            existingActivity.setDate(newDateTime);
        }

        try {
            activityRepository.save(existingActivity);
        } catch (Exception e) {
            throw new RuntimeException("Error al actualizar la actividad: " + e.getMessage(), e);
        }
    }

    public void deleteActivity(Long id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new NoActivityWithIdException("Activity not found with id: " + id));

        try {
            activityRepository.delete(activity);
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar la actividad: " + e.getMessage(), e);
        }
    }

    public List<ActivityTypeDTO> getAllActivitiesTypeDto() {
        List<Activity> activities = activityRepository.findAll();
        return activities.stream()
                .map(this::convertToActivityTypeDTO)
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
                .trainerId(act.getTrainer().getId())
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
                            .status(a.getAttendance())
                            .build();
                }).collect(Collectors.toList()))
                .currentParticipants(act.getAttendances().size())
                .status(act.getStatus())
                .createdAt(act.getCreatedAt())
                .isRecurring(act.getIsRecurring())
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
                .map(this::convertToActivityTypeDTO)
                .collect(Collectors.toList());
    }

    @Override
    public EnrollmentResponseDTO enrollUser(EnrollmentRequestDTO enrollmentRequest) {
        try {
            AttendanceDTO attendance = attendanceService.enrollUser(
                enrollmentRequest.getUserId(),
                enrollmentRequest.getActivityId()
            );

            return EnrollmentResponseDTO.builder()
                    .success(true)
                    .message("Usuario inscrito exitosamente")
                    .enrollment(attendance)
                    .build();
        } catch (Exception e) {
            return EnrollmentResponseDTO.builder()
                    .success(false)
                    .message("Error al inscribir usuario: " + e.getMessage())
                    .build();
        }
    }

    @Override
    public EnrollmentResponseDTO unenrollUser(EnrollmentRequestDTO enrollmentRequest) {
        try {
            attendanceService.unenrollUser(
                enrollmentRequest.getUserId(),
                enrollmentRequest.getActivityId()
            );

            return EnrollmentResponseDTO.builder()
                    .success(true)
                    .message("Usuario desinscrito exitosamente")
                    .enrollment(null)
                    .build();
        } catch (Exception e) {
            return EnrollmentResponseDTO.builder()
                    .success(false)
                    .message("Error al desinscribir usuario: " + e.getMessage())
                    .build();
        }
    }

    @Override
    public boolean isUserEnrolled(Long userId, Long activityId) {
        return attendanceService.isUserEnrolled(userId, activityId);
    }

    private ActivityTypeDTO convertToActivityTypeDTO(Activity activity) {
        return ActivityTypeDTO.builder()
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
                .isRecurring(activity.getIsRecurring())
                .build();
    }

    @Scheduled(cron = "0 */30 * * * *")
    @Transactional
    public void checkCompletedActivies() {
        log.info("Checking completed activities...");
        LocalDateTime now = LocalDateTime.now();

        List<Activity> activities = activityRepository.findByDateBeforeAndStatus(now, ActivityStatus.active);
        List<Activity> toUpdate = new ArrayList<>();
        List<Activity> toCreate = new ArrayList<>();

        for (Activity activity : activities) {
            if (activity.getDate().isAfter(now)) continue;
            activity.setStatus(ActivityStatus.completed);
            log.info("Activity with ID {} marked as completed", activity.getId());
            toUpdate.add(activity);

            if(!activity.getRepeatEveryWeek()) continue;
            else {
                log.info("Activity with ID {} generates a new activity for the next week", activity.getId());
                LocalDateTime nextDate = activity.getDate().plusWeeks(1);
                Activity newActivity = Activity.builder()
                        .name(activity.getName())
                        .description(activity.getDescription())
                        .slots(activity.getSlots())
                        .date(nextDate)
                        .repeatEveryWeek(true)
                        .duration(activity.getDuration())
                        .status(ActivityStatus.active)
                        .trainer(activity.getTrainer())
                        .createdAt(LocalDateTime.now())
                        .build();
                toCreate.add(newActivity);
            }
        }

        // TODO: Logica transaccional para crear y actualizar actividades
        if (!toUpdate.isEmpty()) activityRepository.saveAll(toUpdate);
        if (!toCreate.isEmpty()) activityRepository.saveAll(toCreate);

        log.info("Activities completed and generated succesfully. End of checkCompletedActivities process.");

    }

}
