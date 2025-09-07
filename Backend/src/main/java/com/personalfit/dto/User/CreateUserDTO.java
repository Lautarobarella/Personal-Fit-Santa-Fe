// src/main/java/com/personalfit/personalfit/dto/CreateUserDTO.java
package com.personalfit.dto.User;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

import com.personalfit.enums.UserRole;
import com.personalfit.enums.UserStatus;

@Data
@NoArgsConstructor
public class CreateUserDTO {

    @NotBlank(message = "The first name mustn't be empty")
    private String firstName;

    @NotBlank(message = "The last name mustn't be empty")
    private String lastName;

    @NotBlank(message = "The email mustn't be empty")
    @Email(message = "Invalid email")
    private String email;

    @NotNull(message = "The birthday mustn't be empty")
    private LocalDate birthDate;

//    @NotBlank(message = "The password mustn't be empty")
    private String password;
    private String phone; // Este es opcional, sin anotaciones de nulidad
    private String emergencyPhone; // Teléfono de emergencia, también opcional

    @NotNull(message = "The DNI number mustn't be empty")
    private String dni;

    @NotBlank(message = "The address mustn't be empty")
    private String address;
    private LocalDate joinDate;
    private UserStatus status;
    private String avatar;
    private UserRole role;

}