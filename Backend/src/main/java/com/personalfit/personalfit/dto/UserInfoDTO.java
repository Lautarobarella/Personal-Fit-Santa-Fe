package com.personalfit.personalfit.dto;

import com.personalfit.personalfit.utils.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private Integer age;
    private LocalDate birthDate;
    private String address;
    private UserRole role;
    private String status;
    private LocalDate joinDate;
    private String avatar;
} 