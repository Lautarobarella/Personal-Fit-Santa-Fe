package com.personalfit.personalfit.models;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import com.personalfit.personalfit.utils.UserRole;
import com.personalfit.personalfit.utils.UserStatus;

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
@SQLDelete(sql = "UPDATE app_user SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // private String userName;
    private String firstName;
    private String lastName;
    private String password;
    private String phone;
    private String email;
    private String avatar; // Por ahora son las iniciales del nombre y apellido, ejemplo: Juan Pérez -> JP
    private LocalDate joinDate; // Fecha de alta del usuario
    private String address;
    private LocalDate birthDate; // Fecha de nacimiento del usuario
    private LocalDateTime lastAttendance; // Fecha de la última asistencia del usuario
//    @Column(unique = true)
    private Integer dni;
    @Enumerated(EnumType.STRING)
    private UserRole role;
    @Enumerated(EnumType.STRING)
    private UserStatus status;
    @OneToMany(mappedBy = "user")
    private List<Attendance> attendances;
    @OneToMany(mappedBy = "user")
    private List<Payment> payments;
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
