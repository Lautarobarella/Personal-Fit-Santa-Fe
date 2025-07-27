package com.personalfit.personalfit.models;

import com.personalfit.personalfit.utils.ActivityStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;
    private String name;
    private String description;
    private Integer slots;
    private LocalDateTime date;
    private Boolean repeatEveryWeek;
    @Enumerated(EnumType.STRING)
    private ActivityStatus status;
    @OneToOne
    @JoinColumn(name = "trainer_id", nullable = false)
    private User trainer;
    @OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Attendance> attendances;

}
