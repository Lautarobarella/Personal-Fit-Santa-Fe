package com.personalfit.dto.Payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.personalfit.enums.MethodType;
import com.personalfit.enums.PaymentStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTypeDTO {
    private Long id;
    private Long clientId;
    private String clientName;
    private LocalDateTime createdAt;
    private Double amount;
    private PaymentStatus status;
    private String receiptUrl;
    private LocalDateTime verifiedAt;
    private String verifiedBy;
    private String rejectionReason;
    private LocalDateTime updatedAt;
    private LocalDateTime expiresAt;
    private Long receiptId;
    private MethodType method;

}
