package com.personalfit.dto;

import java.time.LocalDateTime;
import java.util.Map;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ErrorDTO {

    private String message;
    private LocalDateTime timestamp;
    private String path;
    private String error;
    private Integer status;
    private Map<String, String> details;

}
