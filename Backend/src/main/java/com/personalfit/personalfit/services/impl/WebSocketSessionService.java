package com.personalfit.personalfit.services.impl;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Service
public class WebSocketSessionService {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final Map<String, String> userSessions = new ConcurrentHashMap<>(); // userId -> sessionId
    
    public WebSocketSessionService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    // Registrar sesión de usuario
    public void registerUserSession(String userId, String sessionId) {
        userSessions.put(userId, sessionId);
    }
    
    // Remover sesión de usuario
    public void removeUserSession(String userId) {
        userSessions.remove(userId);
    }
    
    // Enviar mensaje a un usuario específico
    public void sendToUser(String userId, String destination, Object payload) {
        messagingTemplate.convertAndSendToUser(userId, destination, payload);
    }
    
    // Enviar mensaje a todos los usuarios
    public void sendToAll(String destination, Object payload) {
        messagingTemplate.convertAndSend(destination, payload);
    }
    
    // Verificar si un usuario está conectado
    public boolean isUserConnected(String userId) {
        return userSessions.containsKey(userId);
    }
    
    // Obtener sessionId por userId
    public String getSessionId(String userId) {
        return userSessions.get(userId);
    }
    
    // Obtener userId por sessionId
    public String getUserIdBySessionId(String sessionId) {
        for (Map.Entry<String, String> entry : userSessions.entrySet()) {
            if (entry.getValue().equals(sessionId)) {
                return entry.getKey();
            }
        }
        return null;
    }

    public void sendNotificationUpdateToUser(Long userId, String destination, Object payload) {
        try {
            System.out.println("Enviando notificación WebSocket a usuario " + userId + " en destino " + destination + " con payload: " + payload);
            
            // Debug: mostrar estado de las sesiones
            System.out.println("Estado de sesiones activas:");
            for (Map.Entry<String, String> entry : userSessions.entrySet()) {
                System.out.println("  Usuario " + entry.getKey() + " -> Sesión " + entry.getValue());
            }
            
            // Usar el userId directamente en lugar de sessionId para evitar problemas de sincronización
            messagingTemplate.convertAndSendToUser(
                userId.toString(),
                destination,
                payload);
                
            System.out.println("Notificación WebSocket enviada exitosamente a usuario " + userId);
        } catch (Exception e) {
            System.err.println("Error al enviar notificación WebSocket a usuario " + userId + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // Método de debug para mostrar el estado de las sesiones
    public void debugSessions() {
        System.out.println("=== DEBUG: ESTADO DE SESIONES WEB SOCKET ===");
        System.out.println("Total de sesiones activas: " + userSessions.size());
        for (Map.Entry<String, String> entry : userSessions.entrySet()) {
            System.out.println("  Usuario " + entry.getKey() + " -> Sesión " + entry.getValue());
        }
        System.out.println("=== FIN DEBUG ===");
    }
}