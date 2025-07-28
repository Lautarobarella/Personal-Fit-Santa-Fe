package com.personalfit.personalfit.dto;

import com.personalfit.personalfit.utils.MethodType;
import com.personalfit.personalfit.utils.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InCreatePaymentDTO {
    private Long clientId;
    private Integer clientDni;
    private Long confNumber;
    private Double amount;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private MethodType methodType;
    private PaymentStatus paymentStatus;
}
