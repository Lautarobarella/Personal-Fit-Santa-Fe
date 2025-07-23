// src/main/java/com/personalfit/personalfit/dto/CreateUserDTO.java
package com.personalfit.personalfit.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
public class InCreateUserDTO {

    @NotBlank(message = "The first name mustn't be empty")
    private String firstName;

    @NotBlank(message = "The last name mustn't be empty")
    private String lastName;

    @NotBlank(message = "The femail mustn't be empty")
    @Email(message = "Invalid email")
    private String email;

    @NotNull(message = "The birthday mustn't be empty")
    private LocalDate birthDate;

//    @NotBlank(message = "The password mustn't be empty")
    private String password;

    private String phone; // Este es opcional, sin anotaciones de nulidad

    @NotNull(message = "The DNI number mustn't be empty")
    private Integer dni;

    @NotBlank(message = "The address mustn't be empty")
    private String address;
}