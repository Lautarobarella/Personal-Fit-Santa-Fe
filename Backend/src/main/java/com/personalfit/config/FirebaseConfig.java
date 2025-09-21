package com.personalfit.config;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;

import jakarta.annotation.PostConstruct;

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);
    
    // Ruta al archivo de configuración de Firebase en la VPS
    private static final String FIREBASE_CONFIG_PATH = "/opt/firebase/firebase-service-account.json";

    @PostConstruct
    public void initialize() {
        try {
            // Verificar si Firebase ya está inicializado
            if (!FirebaseApp.getApps().isEmpty()) {
                logger.info("🔥 Firebase App already initialized");
                return;
            }

            // Verificar si el archivo de configuración existe
            Path configPath = Paths.get(FIREBASE_CONFIG_PATH);
            if (!Files.exists(configPath)) {
                logger.warn("❌ Firebase service account file not found at: {}", FIREBASE_CONFIG_PATH);
                logger.warn("📋 Push notifications will be disabled.");
                return;
            }

            // Verificar que el archivo no esté vacío
            if (Files.size(configPath) == 0) {
                logger.warn("❌ Firebase service account file is empty: {}", FIREBASE_CONFIG_PATH);
                logger.warn("📋 Push notifications will be disabled.");
                return;
            }

            logger.info("🔍 Loading Firebase configuration from: {}", FIREBASE_CONFIG_PATH);
            logger.info("📊 Config file size: {} bytes", Files.size(configPath));

            // Leer y mostrar el contenido del archivo JSON para debugging
            try {
                String jsonContent = Files.readString(configPath);
                logger.info("🔧 JSON file content preview: {}", jsonContent.substring(0, Math.min(200, jsonContent.length())) + "...");
                
                // Verificar campos específicos importantes
                if (jsonContent.contains("project_id")) {
                    String projectId = extractJsonField(jsonContent, "project_id");
                    logger.info("🆔 Project ID from JSON: {}", projectId);
                }
                if (jsonContent.contains("client_email")) {
                    String clientEmail = extractJsonField(jsonContent, "client_email");
                    logger.info("📧 Client email from JSON: {}", clientEmail);
                }
                if (jsonContent.contains("private_key_id")) {
                    String privateKeyId = extractJsonField(jsonContent, "private_key_id");
                    logger.info("🔑 Private key ID from JSON: {}", privateKeyId);
                }
            } catch (Exception e) {
                logger.warn("⚠️ Could not read JSON content for debugging: {}", e.getMessage());
            }

            // Crear credenciales desde el archivo JSON
            GoogleCredentials credentials = GoogleCredentials.fromStream(
                new FileInputStream(FIREBASE_CONFIG_PATH)
            );

            // Configurar Firebase Options
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .build();

            // Inicializar Firebase
            FirebaseApp.initializeApp(options);
            
            logger.info("✅ Firebase Admin SDK initialized successfully");
            
            // Verificar la configuración después de la inicialización
            FirebaseApp app = FirebaseApp.getInstance();
            FirebaseOptions finalOptions = app.getOptions();
            
            logger.info("🚀 Project ID: {}", finalOptions.getProjectId());
            logger.info("🔑 Service Account ID: {}", finalOptions.getServiceAccountId());
            logger.info("🌐 Database URL: {}", finalOptions.getDatabaseUrl());
            logger.info("📱 Storage Bucket: {}", finalOptions.getStorageBucket());
            
            // Verificar que Firebase está completamente configurado
            logger.info("✅ Firebase App name: {}", app.getName());
            logger.info("🔥 Total Firebase apps initialized: {}", FirebaseApp.getApps().size());
            
        } catch (IOException e) {
            logger.error("❌ Error reading Firebase service account file: {}", FIREBASE_CONFIG_PATH, e);
            logger.error("🔍 Make sure the file exists and contains valid JSON");
        } catch (Exception e) {
            logger.error("❌ Error initializing Firebase Admin SDK", e);
            logger.error("🔍 Exception details: {} - {}", e.getClass().getSimpleName(), e.getMessage());
        }
    }

    /**
     * Bean para FirebaseAuth - se crea solo si Firebase está correctamente inicializado
     * Si Firebase no está disponible, retorna null para no romper la aplicación
     */
    @Bean
    public FirebaseAuth firebaseAuth() {
        if (FirebaseApp.getApps().isEmpty()) {
            logger.warn("⚠️ Firebase not initialized - FirebaseAuth bean will not be available");
            logger.warn("🔧 Application will continue without push notifications");
            return null; // Retornar null en lugar de lanzar excepción
        }
        
        logger.info("✅ Creating FirebaseAuth bean");
        return FirebaseAuth.getInstance();
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
            throw new IllegalStateException("Firebase is not initialized. Check your configuration at: " + FIREBASE_CONFIG_PATH);
        }
        return FirebaseApp.getInstance();
    }

    /**
     * Helper method para extraer un campo del JSON
     */
    private String extractJsonField(String jsonContent, String fieldName) {
        try {
            String searchPattern = "\"" + fieldName + "\"";
            int fieldIndex = jsonContent.indexOf(searchPattern);
            if (fieldIndex == -1) return "NOT_FOUND";
            
            int colonIndex = jsonContent.indexOf(":", fieldIndex);
            if (colonIndex == -1) return "INVALID_FORMAT";
            
            int startQuote = jsonContent.indexOf("\"", colonIndex);
            if (startQuote == -1) return "NO_VALUE";
            
            int endQuote = jsonContent.indexOf("\"", startQuote + 1);
            if (endQuote == -1) return "INCOMPLETE_VALUE";
            
            return jsonContent.substring(startQuote + 1, endQuote);
        } catch (Exception e) {
            return "PARSE_ERROR: " + e.getMessage();
        }
    }
}