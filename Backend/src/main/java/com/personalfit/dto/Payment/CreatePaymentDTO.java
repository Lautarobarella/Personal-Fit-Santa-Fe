package com.personalfit.dto.Payment;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

import com.personalfit.enums.MethodType;
import com.personalfit.enums.PaymentStatus;

@Data
@Builder
public class CreatePaymentDTO {
    private Long clientId;
    private Integer clientDni;
    private Long confNumber;
    private Double amount;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private MethodType methodType;
    private PaymentStatus paymentStatus;
}
