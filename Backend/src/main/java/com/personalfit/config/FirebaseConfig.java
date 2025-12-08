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

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    // Ruta al archivo de configuración de Firebase en la VPS (Fallback)
    private static final String FIREBASE_CONFIG_PATH = "/opt/firebase/firebase-service-account.json";

    // Inyectar variable de entorno si existe
    @Value("${FIREBASE_SERVICE_ACCOUNT:#{null}}")
    private String serviceAccountJsonEnv;

    @PostConstruct
    public void initialize() {
        try {
            // Verificar si Firebase ya está inicializado
            if (!FirebaseApp.getApps().isEmpty()) {
                logger.info("🔥 Firebase App already initialized");
                return;
            }

            InputStream serviceAccountStream = null;
            String source = "";
            String jsonContent = "";

            // 1. Intentar cargar desde variable de entorno
            if (serviceAccountJsonEnv != null && !serviceAccountJsonEnv.isEmpty()
                    && !serviceAccountJsonEnv.equals("null")) {
                logger.info("🔍 Loading Firebase configuration from Environment Variable (FIREBASE_SERVICE_ACCOUNT)");
                jsonContent = serviceAccountJsonEnv;
                serviceAccountStream = new ByteArrayInputStream(jsonContent.getBytes(StandardCharsets.UTF_8));
                source = "Environment Variable";
            }
            // 2. Intentar cargar desde archivo
            else {
                Path configPath = Paths.get(FIREBASE_CONFIG_PATH);
                if (Files.exists(configPath) && Files.size(configPath) > 0) {
                    logger.info("🔍 Loading Firebase configuration from File: {}", FIREBASE_CONFIG_PATH);
                    logger.info("📊 Config file size: {} bytes", Files.size(configPath));
                    jsonContent = Files.readString(configPath);
                    serviceAccountStream = new FileInputStream(FIREBASE_CONFIG_PATH);
                    source = "File: " + FIREBASE_CONFIG_PATH;
                } else {
                    logger.warn("❌ Firebase configuration not found in Env Var or File ({})", FIREBASE_CONFIG_PATH);
                    logger.warn("📋 Push notifications will be disabled.");
                    return;
                }
            }

            // Debugging del contenido JSON
            try {
                logger.info("🔧 JSON content preview (Source: {}): {}", source,
                        jsonContent.substring(0, Math.min(200, jsonContent.length())) + "...");

                if (jsonContent.contains("project_id")) {
                    String projectId = extractJsonField(jsonContent, "project_id");
                    logger.info("🆔 Project ID from JSON: {}", projectId);
                }
                if (jsonContent.contains("client_email")) {
                    String clientEmail = extractJsonField(jsonContent, "client_email");
                    logger.info("📧 Client email from JSON: {}", clientEmail);
                }
            } catch (Exception e) {
                logger.warn("⚠️ Could not parse JSON content for debugging: {}", e.getMessage());
            }

            // Crear credenciales
            GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccountStream);

            // Configurar Firebase Options
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    // Estos valores pueden ser sobrescritos por el JSON de credenciales, pero se
                    // dejan por si acaso
                    .setProjectId("personal-fit-santa-fe")
                    .setStorageBucket("personal-fit-santa-fe.firebasestorage.app")
                    .build();

            // Inicializar Firebase
            FirebaseApp.initializeApp(options);

            logger.info("✅ Firebase Admin SDK initialized successfully from {}", source);

            // Verificar la configuración
            FirebaseApp app = FirebaseApp.getInstance();
            FirebaseOptions finalOptions = app.getOptions();

            logger.info("🚀 Project ID: {}", finalOptions.getProjectId());
            logger.info("🔑 Service Account ID: {}", finalOptions.getServiceAccountId());

            logger.info("✅ Firebase App name: {}", app.getName());

        } catch (IOException e) {
            logger.error("❌ Error reading Firebase configuration: {}", e.getMessage(), e);
        } catch (Exception e) {
            logger.error("❌ Error initializing Firebase Admin SDK", e);
        }
    }

    @Bean
    public FirebaseAuth firebaseAuth() {
        if (FirebaseApp.getApps().isEmpty()) {
            logger.warn("⚠️ Firebase not initialized - FirebaseAuth bean will not be available");
            return null;
        }
        return FirebaseAuth.getInstance();
    }

    public boolean isFirebaseConfigured() {
        return !FirebaseApp.getApps().isEmpty();
    }

    private String extractJsonField(String jsonContent, String fieldName) {
        try {
            String searchPattern = "\"" + fieldName + "\"";
            int fieldIndex = jsonContent.indexOf(searchPattern);
            if (fieldIndex == -1)
                return "NOT_FOUND";

            int colonIndex = jsonContent.indexOf(":", fieldIndex);
            if (colonIndex == -1)
                return "INVALID_FORMAT";

            int startQuote = jsonContent.indexOf("\"", colonIndex);
            if (startQuote == -1)
                return "NO_VALUE";

            int endQuote = jsonContent.indexOf("\"", startQuote + 1);
            if (endQuote == -1)
                return "INCOMPLETE_VALUE";

            return jsonContent.substring(startQuote + 1, endQuote);
        } catch (Exception e) {
            return "PARSE_ERROR: " + e.getMessage();
        }
    }
}
