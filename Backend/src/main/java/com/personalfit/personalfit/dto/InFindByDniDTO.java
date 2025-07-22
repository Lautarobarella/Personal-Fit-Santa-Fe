package com.personalfit.personalfit.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class InFindByDniDTO {

    @NotNull
    private Integer dni;
}
