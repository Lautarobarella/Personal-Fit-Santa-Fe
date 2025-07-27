package com.personalfit.personalfit.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class LocalDateTimeDTO {
    private LocalDateTime date;
}
