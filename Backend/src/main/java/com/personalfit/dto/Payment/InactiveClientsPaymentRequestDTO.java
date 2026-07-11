package com.personalfit.dto.Payment;

import java.util.List;

import com.personalfit.enums.MethodType;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para la carga rápida de pagos de clientes inactivos (solo ADMIN).
 * El backend calcula el monto (cuota mensual x clientes), fuerza el estado
 * PAID y resuelve el creador desde el principal autenticado; por eso este
 * DTO solo transporta los destinatarios y datos opcionales.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InactiveClientsPaymentRequestDTO {

    @NotEmpty(message = "Debe seleccionar al menos un cliente")
    private List<@NotNull(message = "El DNI del cliente es obligatorio") Integer> clientDnis;

    /**
     * Cuota mensual que el admin vio al confirmar. No define el monto (eso lo
     * calcula el backend); solo permite rechazar la operación si la
     * configuración cambió entre la previsualización y la confirmación.
     */
    @NotNull(message = "La cuota mensual esperada es obligatoria")
    private Double expectedMonthlyFee;

    private MethodType methodType;

    private String notes;
}
