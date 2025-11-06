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
import com.google.firebase.messaging.FirebaseMessaging;

import jakarta.annotation.PostConstruct;

/**
 * Configuración de Firebase Admin SDK para FCM
 * Configurado según la arquitectura definida en el documento de notificaciones:
 * - Carga el serviceAccount.json desde /opt/firebase/
 * - Inicializa FirebaseApp y FirebaseMessaging
 * - Proporciona beans necesarios para el envío de notificaciones push
 */
@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);
    
    // Ruta al archivo de service account según la arquitectura del documento
    private static final String FIREBASE_SERVICE_ACCOUNT_PATH = "/opt/firebase/serviceAccount.json";

    @PostConstruct
    public void initialize() {
        try {
            // Verificar si Firebase ya está inicializado
            if (!FirebaseApp.getApps().isEmpty()) {
                logger.info("🔥 Firebase App already initialized");
                return;
            }

            // Verificar si el archivo de service account existe
            Path configPath = Paths.get(FIREBASE_SERVICE_ACCOUNT_PATH);
            if (!Files.exists(configPath)) {
                logger.warn("❌ Firebase service account file not found at: {}", FIREBASE_SERVICE_ACCOUNT_PATH);
                logger.warn("📋 Push notifications will be disabled - make sure serviceAccount.json exists in /opt/firebase/");
                return;
            }

            // Verificar que el archivo no esté vacío
            if (Files.size(configPath) == 0) {
                logger.warn("❌ Firebase service account file is empty: {}", FIREBASE_SERVICE_ACCOUNT_PATH);
                logger.warn("📋 Push notifications will be disabled.");
                return;
            }

            logger.info("🔍 Loading Firebase service account from: {}", FIREBASE_SERVICE_ACCOUNT_PATH);
            logger.info("📊 Service account file size: {} bytes", Files.size(configPath));

            // Crear credenciales desde el archivo JSON del service account
            GoogleCredentials credentials = GoogleCredentials.fromStream(
                new FileInputStream(FIREBASE_SERVICE_ACCOUNT_PATH)
            );

            // Configurar Firebase Options
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .setProjectId("personal-fit-santa-fe")
                .build();

            // Inicializar Firebase
            FirebaseApp.initializeApp(options);
            
            logger.info("✅ Firebase Admin SDK initialized successfully");
            logger.info("🚀 Project ID: {}", options.getProjectId());
            logger.info("� Firebase ready for FCM push notifications");
            
        } catch (IOException e) {
            logger.error("❌ Error reading Firebase service account file: {}", FIREBASE_SERVICE_ACCOUNT_PATH, e);
            logger.error("🔍 Make sure the file exists and contains valid service account JSON");
        } catch (Exception e) {
            logger.error("❌ Error initializing Firebase Admin SDK", e);
            logger.error("🔍 Exception details: {} - {}", e.getClass().getSimpleName(), e.getMessage());
        }
    }

    /**
     * Bean para FirebaseMessaging - componente principal para envío de notificaciones push
     * Según el documento: se usa FirebaseMessaging.getInstance().sendMulticast(message)
     * Retorna null si Firebase no está configurado, lo que requiere @Autowired(required = false)
     */
    @Bean
    public FirebaseMessaging firebaseMessaging() {
        try {
            if (!isFirebaseConfigured()) {
                logger.info("🔕 Firebase not initialized - FirebaseMessaging bean will be null (notifications disabled)");
                return null;
            }
            
            logger.info("✅ Creating FirebaseMessaging bean for FCM push notifications");
            return FirebaseMessaging.getInstance();
            
        } catch (Exception e) {
            logger.error("❌ Error creating FirebaseMessaging bean", e);
            return null;
        }
    }

    /**
     * Verifica si Firebase está correctamente configurado
     * Usado por el NotificationService para verificar antes de enviar notificaciones
     */
    public boolean isFirebaseConfigured() {
        return !FirebaseApp.getApps().isEmpty();
    }

    /**
     * Obtiene la instancia de FirebaseApp
     */
    public FirebaseApp getFirebaseApp() {
        if (!isFirebaseConfigured()) {
            throw new IllegalStateException("Firebase is not initialized. Check your service account at: " + FIREBASE_SERVICE_ACCOUNT_PATH);
        }
        return FirebaseApp.getInstance();
    }
}