package com.personalfit.personalfit.dto;

import java.time.LocalDateTime;

import org.springframework.web.multipart.MultipartFile;

import com.personalfit.personalfit.utils.MethodType;
import com.personalfit.personalfit.utils.PaymentStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InCreatePaymentWithFileDTO {
    private Long clientId;
    private Integer clientDni;
    private Long confNumber;
    private Double amount;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private MethodType methodType;
    private PaymentStatus paymentStatus;
    private MultipartFile file;
} 