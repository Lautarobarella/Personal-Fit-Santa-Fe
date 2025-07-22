package com.personalfit.personalfit.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class InDeleteUserDTO {

    private Long id;
    @NotNull(message = "DNI number mustn't be empty.")
    private Integer dni;
}
