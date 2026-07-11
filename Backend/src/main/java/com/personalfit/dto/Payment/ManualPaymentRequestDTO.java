package com.personalfit.dto.Payment;

import java.util.List;

import com.personalfit.enums.MethodType;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request contract for standard individual and group payment creation.
 *
 * Identity, amount, status and dates are intentionally absent: the backend
 * derives them from the authenticated principal and the current settings.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualPaymentRequestDTO {

    @NotEmpty(message = "Debe seleccionar al menos un cliente")
    private List<@NotNull(message = "El DNI del cliente es obligatorio") Integer> clientDnis;

    @NotNull(message = "La cuota mensual esperada es obligatoria")
    @Positive(message = "La cuota mensual esperada debe ser mayor a cero")
    private Double expectedMonthlyFee;

    @NotNull(message = "El método de pago es obligatorio")
    private MethodType methodType;

    @Size(max = 255, message = "Las notas no pueden superar los 255 caracteres")
    private String notes;
}
