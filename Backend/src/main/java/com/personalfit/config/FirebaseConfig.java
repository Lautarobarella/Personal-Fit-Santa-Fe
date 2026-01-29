package com.personalfit.config;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;

import jakarta.annotation.PostConstruct;

/**
 * Firebase Configuration & Initialization
 * 
 * Handles the secure initialization of the Firebase Admin SDK.
 * Supports dual-loading strategy for credentials to allow seamless
 * transitions between Local Dev (environment variables) and Production VPS
 * (secure file storage).
 */
@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    // Default path on the production Linux VPS server
    private static final String FIREBASE_CONFIG_PATH = "/opt/firebase/firebase-service-account.json";

    // Inject variable: FIREBASE_SERVICE_ACCOUNT (contains the full JSON string).
    // Defaults to null if not present.
    @Value("${FIREBASE_SERVICE_ACCOUNT:#{null}}")
    private String serviceAccountJsonEnv;

    /**
     * Initialization Logic
     * Runs once at application startup (@PostConstruct).
     */
    @PostConstruct
    public void initialize() {
        try {
            // Safety check: Prevent double-initialization in test environments
            if (!FirebaseApp.getApps().isEmpty()) {
                return;
            }

            InputStream serviceAccountStream = null;
            String jsonContent = "";

            // STRATEGY 1: Environment Variable (Preferred for Cloud/Docker)
            // Checks if the full JSON key is passed as an env var.
            if (serviceAccountJsonEnv != null && !serviceAccountJsonEnv.isEmpty()
                    && !serviceAccountJsonEnv.equals("null")) {

                jsonContent = serviceAccountJsonEnv;
                serviceAccountStream = new ByteArrayInputStream(jsonContent.getBytes(StandardCharsets.UTF_8));
            }
            // STRATEGY 2: Filesystem Backup (Preferred for Legacy VPS / Local Dev)
            else {
                Path configPath = Paths.get(FIREBASE_CONFIG_PATH);
                if (Files.exists(configPath) && Files.size(configPath) > 0) {
                    jsonContent = Files.readString(configPath);
                    serviceAccountStream = new FileInputStream(FIREBASE_CONFIG_PATH);
                } else {
                    // Critical Failure: Notification system cannot function without credentials
                    logger.warn("❌ Firebase configuration not found in Env Var or File ({})", FIREBASE_CONFIG_PATH);
                    logger.warn("📋 Push notifications will be disabled.");
                    return;
                }
            }

            // Create Credentials object from the loaded stream
            GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccountStream);

            // Configure SDK Options
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    // Explicitly setting Project ID ensures correct resource targeting,
                    // although usually inferred from credentials.
                    .setProjectId("personal-fit-santa-fe")
                    .setStorageBucket("personal-fit-santa-fe.firebasestorage.app")
                    .build();

            // Initialize the Global Singleton
            FirebaseApp.initializeApp(options);

            // Verification check
            FirebaseApp.getInstance();

        } catch (IOException e) {
            logger.error("❌ Error reading Firebase configuration: {}", e.getMessage(), e);
        } catch (Exception e) {
            logger.error("❌ Error initializing Firebase Admin SDK", e);
        }
    }

    /**
     * FirebaseAuth Bean
     * Exposes the Auth service for dependency injection in other components.
     * Returns null if initialization failed, rather than crashing the app.
     */
    @Bean
    public FirebaseAuth firebaseAuth() {
        if (FirebaseApp.getApps().isEmpty()) {
            logger.warn("⚠️ Firebase not initialized - FirebaseAuth bean will not be available");
            return null;
        }
        return FirebaseAuth.getInstance();
    }

    /**
     * Health Check Helper
     * 
     * @return true if Firebase is active
     */
    public boolean isFirebaseConfigured() {
        return !FirebaseApp.getApps().isEmpty();
    }

}
