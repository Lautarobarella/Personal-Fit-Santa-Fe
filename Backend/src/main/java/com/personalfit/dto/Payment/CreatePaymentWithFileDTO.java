package com.personalfit.dto.Payment;

import java.time.LocalDateTime;

import org.springframework.web.multipart.MultipartFile;

import com.personalfit.enums.MethodType;
import com.personalfit.enums.PaymentStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreatePaymentWithFileDTO {
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