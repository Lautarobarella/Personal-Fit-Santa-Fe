package com.personalfit.services;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.personalfit.dto.Activity.ActivityDetailInfoDTO;
import com.personalfit.dto.Activity.ActivityFormTypeDTO;
import com.personalfit.dto.Activity.ActivityTypeDTO;
import com.personalfit.dto.Activity.ActivityUserDetailDTO;
import com.personalfit.dto.Attendance.AttendanceDTO;
import com.personalfit.dto.Attendance.EnrollmentRequestDTO;
import com.personalfit.dto.Attendance.EnrollmentResponseDTO;
import com.personalfit.enums.ActivityStatus;
import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.exceptions.EntityNotFoundException;
import com.personalfit.models.Activity;
import com.personalfit.models.User;
import com.personalfit.repository.ActivityRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private AttendanceService attendanceService;

    // private final ObjectMapper objectMapper = new ObjectMapper();

    public void createActivity(ActivityFormTypeDTO activity) {
        User trainer = userService.getUserById(Long.parseLong(activity.getTrainerId()));

        LocalDate activityDate = activity.getDate();
        LocalTime activityTime = activity.getTime(); 

        Activity newActivity = Activity.builder()
                .name(activity.getName())
                .description(activity.getDescription())
                .location(activity.getLocation())
                .slots(Integer.parseInt(activity.getMaxParticipants()))
                .date(LocalDateTime.of(activityDate, activityTime))
                .repeatEveryWeek(activity.getIsRecurring() != null ? activity.getIsRecurring() : false)
                .duration(Integer.parseInt(activity.getDuration()))
                .status(ActivityStatus.ACTIVE)
                .trainer(trainer)
                .createdAt(LocalDateTime.now())
                .isRecurring(activity.getIsRecurring())
                .build();

        try {
            activityRepository.save(newActivity);
        } catch (Exception e) {
            throw new BusinessRuleException("Error al guardar la actividad: " + e.getMessage(),
                    "Api/Activity/createActivity");
        }
    }

    public void updateActivity(Long id, ActivityFormTypeDTO activity) {
        Activity existingActivity = activityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Actividad con ID: " + id + " no encontrada",
                        "Api/Activity/updateActivity"));

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
            throw new BusinessRuleException("Error al actualizar la actividad: " + e.getMessage(),
                    "Api/Activity/updateActivity");
        }
    }

    public void deleteActivity(Long id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Actividad con ID: " + id + " no encontrada",
                        "Api/Activity/deleteActivity"));

        try {
            activityRepository.delete(activity);
        } catch (Exception e) {
            throw new BusinessRuleException("Error al eliminar la actividad: " + e.getMessage(),
                    "Api/Activity/deleteActivity");
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
            throw new EntityNotFoundException("Actividad con ID: " + id + " no encontrada",
                    "Api/Activity/getActivityDetailInfo");
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
                            .id(a.getId())
                            .userId(a.getUser().getId())
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

        // Obtener el inicio de la semana: lunes (incluido) - formato ISO/europeo
        LocalDate startOfWeekDate = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDateTime startOfWeek = startOfWeekDate.atStartOfDay(); // 00:00:00

        // Obtener fin de semana: domingo (incluido) - formato ISO/europeo
        LocalDate endOfWeekDate = date.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        LocalDateTime endOfWeek = endOfWeekDate.atTime(LocalTime.MAX); // 23:59:59.999999999

        // Obtener todas las actividades entre el inicio y fin de semana
        List<Activity> allActivities = activityRepository.findByDateBetween(startOfWeek, endOfWeek);

        // Filtrar las actividades que estén dentro del rango [startOfWeek, endOfWeek]
        return allActivities.stream()
                .map(this::convertToActivityTypeDTO)
                .collect(Collectors.toList());
    }

    public EnrollmentResponseDTO enrollUser(EnrollmentRequestDTO enrollmentRequest) {
        try {
            AttendanceDTO attendance = attendanceService.enrollUser(
                    enrollmentRequest.getUserId(),
                    enrollmentRequest.getActivityId());

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

    public EnrollmentResponseDTO unenrollUser(EnrollmentRequestDTO enrollmentRequest) {
        try {
            attendanceService.unenrollUser(
                    enrollmentRequest.getUserId(),
                    enrollmentRequest.getActivityId());

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
                .participants(
                        activity.getAttendances().stream().map(a -> a.getUser().getId()).collect(Collectors.toList()))
                .maxParticipants(activity.getSlots())
                .currentParticipants(activity.getAttendances().size())
                .status(activity.getStatus())
                .isRecurring(activity.getIsRecurring())
                .build();
    }

    // @Scheduled(cron = "0 */30 * * * *")
    @Scheduled(cron = "0 */1 * * * *")
    @Transactional
    public void checkCompletedActivies() {
        log.info("Checking completed activities...");
        LocalDateTime now = LocalDateTime.now();

        // Buscar actividades activas que ya han terminado (fecha + duración < hora
        // actual)
        List<Activity> activeActivities = activityRepository.findByStatus(ActivityStatus.ACTIVE);
        List<Activity> toUpdate = new ArrayList<>();
        List<Activity> toCreate = new ArrayList<>();

        for (Activity activity : activeActivities) {
            // Calcular cuándo termina la actividad (fecha de inicio + duración en minutos)
            LocalDateTime activityEndTime = activity.getDate().plusMinutes(activity.getDuration());

            // Si la actividad ya terminó, marcarla como completada
            if (activityEndTime.isBefore(now)) {
                activity.setStatus(ActivityStatus.COMPLETED);
                toUpdate.add(activity);
                log.info("Activity with ID {} marked as completed (ended at: {})",
                        activity.getId(), activityEndTime);

                // Marcar como ausentes a todos los participantes que estén en estado PENDING
                try {
                    attendanceService.markPendingAttendancesAsAbsent(activity.getId());
                    log.info("Marked pending attendances as absent for completed activity ID: {}", activity.getId());
                } catch (Exception e) {
                    log.error("Error marking pending attendances as absent for activity ID {}: {}",
                            activity.getId(), e.getMessage());
                }

                // Si la actividad tiene activado el repetir semanalmente, crear una nueva para
                // la próxima semana
                if (activity.getRepeatEveryWeek()) {
                    log.info("Creating recurring activity for next week for activity ID: {}", activity.getId());

                    // Calcular la fecha para la próxima semana (mismo día de la semana, misma hora)
                    LocalDateTime nextWeekDate = activity.getDate().plusWeeks(1);

                    Activity newActivity = Activity.builder()
                            .name(activity.getName())
                            .description(activity.getDescription())
                            .location(activity.getLocation())
                            .slots(activity.getSlots())
                            .date(nextWeekDate)
                            .repeatEveryWeek(true)
                            .duration(activity.getDuration())
                            .status(ActivityStatus.ACTIVE)
                            .trainer(activity.getTrainer())
                            .createdAt(LocalDateTime.now())
                            .isRecurring(activity.getIsRecurring())
                            .build();

                    toCreate.add(newActivity);
                    log.info("New recurring activity created for next week: {} at {}",
                            newActivity.getName(), nextWeekDate);
                }
            }
        }

        // Guardar todas las actividades actualizadas y nuevas en una sola transacción
        if (!toUpdate.isEmpty()) {
            activityRepository.saveAll(toUpdate);
            log.info("Updated {} completed activities", toUpdate.size());
        }

        if (!toCreate.isEmpty()) {
            activityRepository.saveAll(toCreate);
            log.info("Created {} new recurring activities", toCreate.size());
        }

        log.info("Activities check completed successfully. Updated: {}, Created: {}",
                toUpdate.size(), toCreate.size());
    }

}
