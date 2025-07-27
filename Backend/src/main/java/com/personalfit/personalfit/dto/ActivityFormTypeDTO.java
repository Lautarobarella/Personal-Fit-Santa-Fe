package com.personalfit.personalfit.dto;

import lombok.Builder;
import lombok.Data;
import org.springframework.cglib.core.Local;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
public class ActivityFormTypeDTO {
    private String name;
    private String description;
    private String location;
    private String trainerId; // Parsear a Integer
    private LocalDate date; // yyyy-MM-dd
    private LocalTime time; // HH:mm:ss
    private String duration; // Representa minutos
    private String maxParticipants; // Parsear a Integer
}
