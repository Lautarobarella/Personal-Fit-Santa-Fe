package com.personalfit.personalfit.models;

import com.personalfit.personalfit.utils.AttendanceStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    @ManyToOne
    @JoinColumn(name = "activity_id")
    private Activity activity;
    @Enumerated(EnumType.STRING)
    private AttendanceStatus attendance;

}
