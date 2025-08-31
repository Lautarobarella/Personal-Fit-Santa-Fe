package com.personalfit.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "app.cookie")
public class CookieProperties {
    
    private boolean secure = true; // Por defecto true para producción
    private String sameSite = "Strict";
    private int accessTokenMaxAge = 24 * 60 * 60; // 24 horas en segundos
    private int refreshTokenMaxAge = 7 * 24 * 60 * 60; // 7 días en segundos
    private String domain = null; // null para usar el dominio actual
    
}
