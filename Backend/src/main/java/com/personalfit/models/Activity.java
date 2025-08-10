package com.personalfit.models;

import java.time.LocalDateTime;
import java.util.List;

import com.personalfit.enums.ActivityStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private String location;
    private Integer slots;
    private LocalDateTime date;
    private LocalDateTime createdAt;
    private Boolean repeatEveryWeek;
    private Integer duration; // Minutes
    @Enumerated(EnumType.STRING)
    private ActivityStatus status;
    
    // Field for weekly repetition
    private Boolean isRecurring;
    
    @ManyToOne
    @JoinColumn(name = "trainer_id", nullable = false)
    private User trainer;
    @OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Attendance> attendances;

}
