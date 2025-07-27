package com.personalfit.personalfit.models;

import com.personalfit.personalfit.utils.UserStatus;
import com.personalfit.personalfit.utils.UserRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "app_user")
@SQLDelete(sql = "UPDATE app_user SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
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
    @Column(unique = true)
    private Integer dni;
    @Enumerated(EnumType.STRING)
    private UserRole role;
    @Enumerated(EnumType.STRING)
    private UserStatus status;
    @OneToMany(mappedBy = "user")
    private List<Attendance> attendances;
    @OneToMany(mappedBy = "user")
    private List<Payment> payments;


    private LocalDateTime deletedAt = null;

}
