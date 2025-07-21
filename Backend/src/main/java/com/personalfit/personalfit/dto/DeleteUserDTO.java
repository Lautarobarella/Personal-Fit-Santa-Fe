package com.personalfit.personalfit.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@NoArgsConstructor
public class DeleteUserDTO {

    private Long id;
    @NotNull(message = "DNI number mustn't be empty.")
    private Integer dni;
}
