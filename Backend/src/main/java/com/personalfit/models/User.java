package com.personalfit.models;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;

import com.personalfit.enums.UserRole;
import com.personalfit.enums.UserStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "app_user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "first_name")
    private String firstName;
    @Column(name = "last_name")
    private String lastName;
    @Column(name = "password")
    private String password;
    @Column(name = "phone")
    private String phone;
    @Column(name = "email")
    private String email;
    private String avatar; // Por ahora son las iniciales del nombre y apellido, ejemplo: Juan Pérez -> JP
    @Column(name = "join_date")
    private LocalDate joinDate; // Fecha de alta del usuario
    @Column(name = "address")
    private String address;
    @Column(name = "birth_date")
    private LocalDate birthDate; // Fecha de nacimiento del usuario
    private LocalDateTime lastAttendance; // Fecha de la última asistencia del usuario
    @Column(name = "dni", unique = true)
    private Integer dni;
    @Enumerated(EnumType.STRING)
    private UserRole role;
    @Enumerated(EnumType.STRING)
    private UserStatus status;
    @OneToMany(mappedBy = "user")
    private List<Attendance> attendances;
    // @OneToMany(mappedBy = "user")
    // private List<Payment> payments; // Removido - ahora se usa PaymentUser
    @OneToMany(mappedBy = "user")
    private List<Notification> notifications;

    private LocalDateTime deletedAt = null;

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public Integer getAge() {
        if (birthDate == null) {
            return null;
        }
        return Period.between(birthDate, LocalDate.now()).getYears();
    }
}
