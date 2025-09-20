package com.personalfit.config;

import java.io.ByteArrayInputStream;
import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

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
        // Declarar variables fuera del try para que estén disponibles en el catch
        String serviceAccountKey = "";
        String projectId = "";
        String databaseUrl = "";
        String firebaseEnabled = "";
        
        try {
            // Verificar si Firebase ya está inicializado
            if (!FirebaseApp.getApps().isEmpty()) {
                logger.info("Firebase App already initialized");
                return;
            }

            // Log de diagnóstico de variables de entorno
            logger.info("🔍 FIREBASE CONFIG DIAGNOSIS - Reading environment variables:");
            
            // Log de todas las propiedades del sistema para debug
            logger.info("💾 System Environment Check:");
            logger.info("  • Available environment variables starting with FIREBASE:");
            System.getenv().entrySet().stream()
                .filter(entry -> entry.getKey().startsWith("FIREBASE"))
                .forEach(entry -> logger.info("    - {}: {} (length: {})", 
                    entry.getKey(), 
                    entry.getValue().isEmpty() ? "❌ EMPTY" : "✅ SET",
                    entry.getValue().length()));
            
            // Leer configuración directamente desde environment para evitar problemas de placeholders circulares
            serviceAccountKey = environment.getProperty("FIREBASE_SERVICE_ACCOUNT_KEY_CONTENT", "");
            projectId = environment.getProperty("FIREBASE_PROJECT_ID", "");
            databaseUrl = environment.getProperty("FIREBASE_DATABASE_URL", "");
            firebaseEnabled = environment.getProperty("FIREBASE_ENABLED", "");

            // Log detallado de cada variable
            logger.info("📋 Environment Variables Status:");
            logger.info("  • FIREBASE_SERVICE_ACCOUNT_KEY_CONTENT: {} (length: {})", 
                serviceAccountKey.isEmpty() ? "❌ NOT SET" : "✅ SET", 
                serviceAccountKey.length());
            
            if (!serviceAccountKey.isEmpty() && serviceAccountKey.length() > 50) {
                logger.info("  • Service Account Key Preview: {}...{}", 
                    serviceAccountKey.substring(0, 20), 
                    serviceAccountKey.substring(serviceAccountKey.length() - 20));
            }
            
            logger.info("  • FIREBASE_PROJECT_ID: {} {}", 
                projectId.isEmpty() ? "❌ NOT SET" : "✅ " + projectId, 
                projectId.isEmpty() ? "" : "(length: " + projectId.length() + ")");
            
            logger.info("  • FIREBASE_DATABASE_URL: {} {}", 
                databaseUrl.isEmpty() ? "❌ NOT SET" : "✅ " + databaseUrl, 
                databaseUrl.isEmpty() ? "" : "(length: " + databaseUrl.length() + ")");
            
            logger.info("  • FIREBASE_ENABLED: {} {}", 
                firebaseEnabled.isEmpty() ? "❌ NOT SET" : "✅ " + firebaseEnabled, 
                firebaseEnabled.isEmpty() ? "" : "(length: " + firebaseEnabled.length() + ")");

            // Verificar que tenemos la configuración necesaria
            if (serviceAccountKey == null || serviceAccountKey.trim().isEmpty()) {
                logger.warn("❌ Firebase service account key not configured. Push notifications will be disabled.");
                return;
            }

            if (projectId == null || projectId.trim().isEmpty()) {
                logger.warn("❌ Firebase project ID not configured. Push notifications will be disabled.");
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
            
            logger.info("✅ Firebase Admin SDK initialized successfully!");
            logger.info("📊 Firebase Configuration Summary:");
            logger.info("  • Project ID: {}", projectId);
            logger.info("  • Database URL: {}", databaseUrl.isEmpty() ? "Not configured" : databaseUrl);
            logger.info("  • Service Account: Configured with {} characters", serviceAccountKey.length());
            logger.info("  • Firebase Apps Count: {}", FirebaseApp.getApps().size());
            
        } catch (IOException e) {
            logger.error("❌ Error initializing Firebase Admin SDK: Invalid service account key format", e);
            logger.error("🔍 Service account key starts with: {}", 
                serviceAccountKey != null && serviceAccountKey.length() > 10 ? 
                serviceAccountKey.substring(0, 10) : "N/A");
        } catch (Exception e) {
            logger.error("❌ Error initializing Firebase Admin SDK", e);
            logger.error("🔍 Exception details: {} - {}", e.getClass().getSimpleName(), e.getMessage());
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