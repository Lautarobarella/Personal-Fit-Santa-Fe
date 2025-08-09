package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.services.impl.WebSocketSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/websocket-test")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class WebSocketTestController {

    @Autowired
    private WebSocketSessionService webSocketService;

    @PostMapping("/send-notification/{userId}")
    public ResponseEntity<String> sendTestNotification(@PathVariable Long userId, @RequestBody Map<String, Object> payload) {
        try {
            System.out.println("=== ENVIANDO NOTIFICACIÓN DE PRUEBA ===");
            System.out.println("Usuario destino: " + userId);
            System.out.println("Payload: " + payload);
            
            // Verificar si el usuario está conectado
            boolean isConnected = webSocketService.isUserConnected(userId.toString());
            System.out.println("Usuario conectado: " + isConnected);
            
            if (isConnected) {
                // Enviar notificación de prueba
                webSocketService.sendNotificationUpdateToUser(userId, "/queue/notifications", payload.get("count"));
                System.out.println("✓ Notificación de prueba enviada exitosamente");
                return ResponseEntity.ok("Notificación enviada exitosamente");
            } else {
                System.out.println("✗ Usuario no está conectado");
                return ResponseEntity.badRequest().body("Usuario no está conectado");
            }
        } catch (Exception e) {
            System.err.println("Error al enviar notificación de prueba: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getWebSocketStatus() {
        try {
            // Debug: mostrar estado de sesiones
            webSocketService.debugSessions();
            
            return ResponseEntity.ok(Map.of(
                "message", "Estado de WebSocket obtenido",
                "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", e.getMessage(),
                "timestamp", System.currentTimeMillis()
            ));
        }
    }
}
