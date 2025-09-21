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
            logger.info("🚀 Project ID: {}", FirebaseApp.getInstance().getOptions().getProjectId());
            
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
}