package com.personalfit.personalfit.dto;

import com.personalfit.personalfit.utils.MethodType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InCreatePaymentDTO {
    private Long clientId;
    private Long confNumber;
    private Double amount;
    private String fileUrl;
    private MethodType methodType;
}
