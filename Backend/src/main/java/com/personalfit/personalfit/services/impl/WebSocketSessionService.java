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

    public void sendNotificationUpdateToUser(Long userId, String destination, Object payload) {
        String sessionId = userSessions.get(userId.toString());

        if (sessionId == null) return;

        messagingTemplate.convertAndSendToUser(
            sessionId,
            destination, // deberia ser -> /queue/updates para actualizacion de una nueva notificacion
            payload);
    }
}