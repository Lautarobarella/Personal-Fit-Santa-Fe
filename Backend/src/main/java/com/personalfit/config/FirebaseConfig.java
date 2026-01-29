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
                return;
            }

            InputStream serviceAccountStream = null;
            String jsonContent = "";

            // 1. Intentar cargar desde variable de entorno
            if (serviceAccountJsonEnv != null && !serviceAccountJsonEnv.isEmpty()
                    && !serviceAccountJsonEnv.equals("null")) {

                jsonContent = serviceAccountJsonEnv;
                serviceAccountStream = new ByteArrayInputStream(jsonContent.getBytes(StandardCharsets.UTF_8));
            }
            // 2. Intentar cargar desde archivo
            else {
                Path configPath = Paths.get(FIREBASE_CONFIG_PATH);
                if (Files.exists(configPath) && Files.size(configPath) > 0) {

                    jsonContent = Files.readString(configPath);
                    serviceAccountStream = new FileInputStream(FIREBASE_CONFIG_PATH);
                } else {
                    logger.warn("❌ Firebase configuration not found in Env Var or File ({})", FIREBASE_CONFIG_PATH);
                    logger.warn("📋 Push notifications will be disabled.");
                    return;
                }
            }

            // Debugging removido

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

            // Verificar la configuración
            FirebaseApp.getInstance();

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

}
