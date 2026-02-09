package com.personalfit.models;

import java.time.LocalDateTime;

import com.personalfit.enums.WorkShiftStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkShift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "trainer_id", nullable = false)
    private User trainer;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    // Total duration in minutes (or hours, depending on preference, logic will
    // define)
    private Double totalHours;

    @Enumerated(EnumType.STRING)
    private WorkShiftStatus status;
}
