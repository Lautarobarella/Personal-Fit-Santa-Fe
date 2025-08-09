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

        if (userId != null) {
            webSocketService.registerUserSession(userId, sessionId);
            System.out.println("Usuario " + userId + " conectado con sesión " + sessionId);
            
            // Notificar a todos que el usuario se conectó
            // webSocketService.sendToAll("/topic/user-status", 
            //     "User " + userId + " connected");
        }
    }
    
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        // Buscar y remover la sesión del usuario
        // Aquí podrías implementar lógica para encontrar el userId por sessionId
        webSocketService.sendToAll("/topic/user-status", 
            "User disconnected from session: " + sessionId);
    }
}