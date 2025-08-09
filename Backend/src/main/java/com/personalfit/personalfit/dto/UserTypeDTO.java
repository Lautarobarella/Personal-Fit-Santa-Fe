package com.personalfit.personalfit.dto;

import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.utils.UserRole;
import com.personalfit.personalfit.utils.UserStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UserTypeDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String phone;
    private String email;
    private String avatar;
    private LocalDate joinDate;
    private String address;
    private LocalDate birthDate;
    private Integer dni;
    private UserRole role;
    private String password;
    private UserStatus status;
    private LocalDate lastActivity; //
    private Integer age;
    private Integer activitiesCount; //

    public UserTypeDTO(Long id, String firstName, String lastName, String phoneNumber, String email, String avatarName,
                       LocalDate joinDate, String address, LocalDate birthDate, Integer dni, UserRole role, String password,
                       UserStatus status, LocalDate lastActivity, Integer age, Integer activitiesCount) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phoneNumber;
        this.email = email;
        this.avatar = avatarName;
        this.joinDate = joinDate;
        this.address = address;
        this.birthDate = birthDate;
        this.dni = dni;
        this.role = role;
        this.password = password;
        this.status = status;
        this.lastActivity = lastActivity; // Calcular
        this.age = age;
        this.activitiesCount = activitiesCount; // Calcular
    }

    public UserTypeDTO(User user) {
        this.id = user.getId();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.phone = user.getPhone();
        this.email = user.getEmail();
        this.avatar = user.getAvatar();
        this.joinDate = user.getJoinDate();
        this.address = user.getAddress();
        this.birthDate = user.getBirthDate();
        this.dni = user.getDni();
        this.role = user.getRole();
        this.password = user.getPassword();
        this.status = user.getStatus() != null ? user.getStatus() : UserStatus.active; // Default to active if status is null
    }
}
