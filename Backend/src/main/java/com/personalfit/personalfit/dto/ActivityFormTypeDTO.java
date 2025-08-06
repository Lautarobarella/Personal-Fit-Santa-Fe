package com.personalfit.personalfit.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
public class ActivityFormTypeDTO {
    private String name;
    private String description;
    private String location;
    private String trainerId; // Parsear a Integer
    private LocalDate date; // Opcional - se usa fecha actual si no se proporciona
    private LocalTime time; // HH:mm:ss
    private String duration; // Representa minutos
    private String maxParticipants; // Parsear a Integer
    
    // Fields for recurring activities
    private Boolean isRecurring;
    private List<Boolean> weeklySchedule; // [lunes, martes, miércoles, jueves, viernes, sábado, domingo]
}
