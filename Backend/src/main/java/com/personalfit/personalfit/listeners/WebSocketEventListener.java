package com.personalfit.personalfit.listeners;

import com.personalfit.personalfit.services.impl.WebSocketSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {
    
    @Autowired
    private WebSocketSessionService webSocketService;
    
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String userId = headerAccessor.getFirstNativeHeader("userId");

        System.out.println("=== EVENTO DE CONEXIÓN WEB SOCKET ===");
        System.out.println("Session ID: " + sessionId);
        System.out.println("User ID: " + userId);
        System.out.println("Headers disponibles: " + headerAccessor.toNativeHeaderMap());

        if (userId != null) {
            webSocketService.registerUserSession(userId, sessionId);
            System.out.println("✓ Usuario " + userId + " registrado con sesión " + sessionId);
            
            // Verificar que se registró correctamente
            boolean isRegistered = webSocketService.isUserConnected(userId);
            System.out.println("Usuario " + userId + " está conectado: " + isRegistered);
            
            // Notificar a todos que el usuario se conectó
            // webSocketService.sendToAll("/topic/user-status", 
            //     "User " + userId + " connected");
        } else {
            System.out.println("✗ No se pudo obtener userId del header");
        }
        System.out.println("=== FIN EVENTO DE CONEXIÓN ===");
    }
    
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        // Buscar y remover la sesión del usuario
        String userId = webSocketService.getUserIdBySessionId(sessionId);
        if (userId != null) {
            webSocketService.removeUserSession(userId);
            System.out.println("Usuario " + userId + " desconectado de la sesión " + sessionId);
        }
        
        webSocketService.sendToAll("/topic/user-status", 
            "User disconnected from session: " + sessionId);
    }
}