package com.personalfit.dto.Payment;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

import com.personalfit.enums.MethodType;
import com.personalfit.enums.PaymentStatus;

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
    private Long receiptId;

}
