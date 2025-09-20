package com.personalfit.config;

import java.io.ByteArrayInputStream;
import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.beans.factory.annotation.Autowired;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import jakarta.annotation.PostConstruct;

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @Autowired
    private Environment environment;

    @PostConstruct
    public void initialize() {
        try {
            // Verificar si Firebase ya está inicializado
            if (!FirebaseApp.getApps().isEmpty()) {
                logger.info("Firebase App already initialized");
                return;
            }

            // Leer configuración directamente desde environment para evitar problemas de placeholders circulares
            String serviceAccountKey = environment.getProperty("FIREBASE_SERVICE_ACCOUNT_KEY_CONTENT", "");
            String projectId = environment.getProperty("FIREBASE_PROJECT_ID", "");
            String databaseUrl = environment.getProperty("FIREBASE_DATABASE_URL", "");

            // Verificar que tenemos la configuración necesaria
            if (serviceAccountKey == null || serviceAccountKey.trim().isEmpty()) {
                logger.warn("Firebase service account key not configured. Push notifications will be disabled.");
                return;
            }

            if (projectId == null || projectId.trim().isEmpty()) {
                logger.warn("Firebase project ID not configured. Push notifications will be disabled.");
                return;
            }

            // Crear credenciales desde la clave de servicio (formato JSON)
            GoogleCredentials credentials = GoogleCredentials
                .fromStream(new ByteArrayInputStream(serviceAccountKey.getBytes()));

            // Configurar Firebase
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .setProjectId(projectId)
                .setDatabaseUrl(databaseUrl)
                .build();

            // Inicializar Firebase
            FirebaseApp.initializeApp(options);
            
            logger.info("Firebase Admin SDK initialized successfully for project: {}", projectId);
            
        } catch (IOException e) {
            logger.error("Error initializing Firebase Admin SDK: Invalid service account key format", e);
        } catch (Exception e) {
            logger.error("Error initializing Firebase Admin SDK", e);
        }
    }

    /**
     * Verifica si Firebase está correctamente configurado
     */
    public boolean isFirebaseConfigured() {
        return !FirebaseApp.getApps().isEmpty();
    }

    /**
     * Obtiene la instancia de FirebaseApp
     */
    public FirebaseApp getFirebaseApp() {
        if (FirebaseApp.getApps().isEmpty()) {
            throw new IllegalStateException("Firebase is not initialized. Check your configuration.");
        }
        return FirebaseApp.getInstance();
    }
}