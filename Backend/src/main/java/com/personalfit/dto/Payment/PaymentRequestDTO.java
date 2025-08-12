package com.personalfit.dto.Payment;

import java.time.LocalDateTime;

import com.personalfit.enums.MethodType;
import com.personalfit.enums.PaymentStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO unificado para todas las operaciones de creación de pagos
 * Reemplaza a CreatePaymentDTO, CreatePaymentWithFileDTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequestDTO {
    private Long clientId;
    private Integer clientDni;
    private Long confNumber;
    private Double amount;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private MethodType methodType;
    private PaymentStatus paymentStatus;
}
