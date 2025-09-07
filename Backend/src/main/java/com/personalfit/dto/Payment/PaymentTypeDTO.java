package com.personalfit.dto.Payment;

import java.time.LocalDateTime;
import java.util.List;

import com.personalfit.enums.MethodType;
import com.personalfit.enums.PaymentStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTypeDTO {
    private Long id;
    
    // Para compatibilidad con pagos existentes (único usuario)
    private Long clientId;
    private String clientName;
    
    // Para pagos múltiples (lista de usuarios asociados)
    private List<PaymentUserInfo> associatedUsers;
    
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
    private String notes; // Notas adicionales del pago
    
    /**
     * Información básica de un usuario asociado al pago
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentUserInfo {
        private Long userId;
        private String userName;
        private Integer userDni;
    }
    
    /**
     * Método helper para determinar si es un pago múltiple
     */
    public boolean isMultipleUsersPayment() {
        return associatedUsers != null && associatedUsers.size() > 1;
    }
    
    /**
     * Método helper para obtener el nombre principal del cliente
     * (para mostrar en listas, usa el primer usuario o el clientName legacy)
     */
    public String getPrimaryClientName() {
        if (associatedUsers != null && !associatedUsers.isEmpty()) {
            if (associatedUsers.size() == 1) {
                return associatedUsers.get(0).getUserName();
            } else {
                return associatedUsers.get(0).getUserName() + " y " + (associatedUsers.size() - 1) + " más";
            }
        }
        return clientName;
    }
}
