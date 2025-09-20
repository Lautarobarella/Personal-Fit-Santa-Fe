package com.personalfit.dto.Notification;


import com.personalfit.enums.DeviceType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterDeviceTokenRequest {

    @NotBlank(message = "Token is required")
    private String token;

    @NotNull(message = "Device type is required")
    private DeviceType deviceType;

    private Long userId; // Opcional, se puede obtener del contexto de seguridad

    private String deviceInfo; // Información adicional del dispositivo
}