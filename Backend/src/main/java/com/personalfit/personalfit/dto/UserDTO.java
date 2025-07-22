package com.personalfit.personalfit.dto;

import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.utils.UserRole;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UserDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String email;
    private String avatarName;
    private LocalDate joinDate;
    private String address;
    private LocalDate birthDate;
    private Integer dni;
    private UserRole role;

    public UserDTO(Long id, String firstName, String lastName, String phoneNumber, String email, String avatarName, LocalDate joinDate, String address, LocalDate birthDate, Integer dni, UserRole role) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.avatarName = avatarName;
        this.joinDate = joinDate;
        this.address = address;
        this.birthDate = birthDate;
        this.dni = dni;
        this.role = role;
    }

    public UserDTO(User user) {
        this.id = user.getId();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.phoneNumber = user.getPhoneNumber();
        this.email = user.getEmail();
        this.avatarName = user.getAvatarName();
        this.joinDate = user.getJoinDate();
        this.address = user.getAddress();
        this.birthDate = user.getBirthDate();
        this.dni = user.getDni();
        this.role = user.getRole();
    }
}
