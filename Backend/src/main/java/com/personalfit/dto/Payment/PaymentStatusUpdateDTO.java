package com.personalfit.dto.Payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
    @NotBlank(message = "El estado es obligatorio")
    @Pattern(regexp = "(?i)PAID|REJECTED", message = "El estado debe ser PAID o REJECTED")
    private String status;

    @Size(max = 255, message = "El motivo de rechazo no puede superar los 255 caracteres")
    private String rejectionReason; // Opcional - solo para rechazos
}
