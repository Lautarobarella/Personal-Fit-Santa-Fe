package com.personalfit.personalfit.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.service.annotation.GetExchange;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Getter
@Setter
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    private String url;
    @Column(unique = true)
    private String confNumer;
    private Double amount;
    private LocalDate date;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

}
