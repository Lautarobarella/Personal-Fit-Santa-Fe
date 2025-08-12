package com.personalfit.dto.Payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO unificado para actualizaciones de estado de pago
 * Reemplaza a UpdatePaymentStatusDTO y RejectPaymentDTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatusUpdateDTO {
    private String status;
    private String rejectionReason; // Opcional - solo para rechazos
}
