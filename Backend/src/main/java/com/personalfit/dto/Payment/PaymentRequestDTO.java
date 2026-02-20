package com.personalfit.dto.Payment;

import java.time.LocalDateTime;
import java.util.List;

import com.personalfit.enums.MethodType;
import com.personalfit.enums.PaymentStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO unificado para todas las operaciones de creación de pagos
 * Soporta tanto pagos individuales como múltiples usuarios
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequestDTO {
    
    // Para pagos individuales (único usuario)
    private Long clientId;
    private Integer clientDni;
    
    // Para pagos manuales múltiples (lista de DNIs)
    private List<Integer> clientDnis;
    
    // DNI del usuario que crea el pago (para identificar createdBy)
    private Integer createdByDni;
    
    private Long confNumber;
    private Double amount;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private MethodType methodType;
    private PaymentStatus paymentStatus;
    private String notes; // Notas adicionales del pago
    
    /**
     * Método helper para determinar si es un pago múltiple
     */
    public boolean isMultipleUsersPayment() {
        return clientDnis != null && !clientDnis.isEmpty();
    }
    
    /**
     * Método helper para obtener la lista de DNIs (unificado)
     */
    public List<Integer> getAllDnis() {
        if (isMultipleUsersPayment()) {
            return clientDnis;
        } else if (clientDni != null) {
            return List.of(clientDni);
        }
        return List.of();
    }
}

