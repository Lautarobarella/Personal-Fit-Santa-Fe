// src/main/java/com/personalfit/personalfit/config/WebConfig.java

package com.personalfit.personalfit.config; // Ajusta el paquete si es necesario

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Aplica la configuración CORS a todas las rutas de tu API
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Métodos HTTP permitidos
                .allowedHeaders("*") // Permite todos los encabezados
                .allowCredentials(true) // Permite el envío de cookies, encabezados de autorización, etc.
                .maxAge(3600); // Duración en segundos que el navegador puede "cachear" la respuesta pre-vuelo
    }
}