package com.personalfit.personalfit.dto;

import com.personalfit.personalfit.utils.MethodType;
import com.personalfit.personalfit.utils.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class VerifyPaymentTypeDTO {
    private Long id;
    private Long clientId;
    private String clientName;
    private Double amount;
    private LocalDateTime createdAt;
    private PaymentStatus status;
    private MethodType method;
    private LocalDateTime expiresAt;
    private String receiptUrl;
}
