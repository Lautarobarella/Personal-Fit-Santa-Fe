package com.personalfit.personalfit.dto;

import com.personalfit.personalfit.utils.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
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

}
