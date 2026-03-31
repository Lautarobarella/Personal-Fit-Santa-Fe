package com.personalfit.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for SecurityConfig.
 * Verifies that public endpoints are accessible and protected endpoints require auth.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Nested
    @DisplayName("Public Endpoints")
    class PublicEndpoints {

        @Test
        @DisplayName("/api/health should be publicly accessible")
        void healthEndpoint_IsPublic() throws Exception {
            mockMvc.perform(get("/api/health"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("/api/auth/login should be publicly accessible")
        void loginEndpoint_IsPublic() throws Exception {
            // Will fail with bad request or other error but NOT 401
            int statusCode = mockMvc.perform(post("/api/auth/login")
                            .contentType("application/json")
                            .content("{\"email\":\"test\",\"password\":\"test\"}"))
                    .andReturn().getResponse().getStatus();
            org.assertj.core.api.Assertions.assertThat(statusCode).isNotEqualTo(401);
        }

        @Test
        @DisplayName("/api/auth/logout should be publicly accessible")
        void logoutEndpoint_IsPublic() throws Exception {
            mockMvc.perform(post("/api/auth/logout"))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("/api/users/public/first-admin should be publicly accessible")
        void firstAdminEndpoint_IsPublic() throws Exception {
            // Will fail validation but NOT with 401
            int statusCode = mockMvc.perform(post("/api/users/public/first-admin")
                            .contentType("application/json")
                            .content("{}"))
                    .andReturn().getResponse().getStatus();
            org.assertj.core.api.Assertions.assertThat(statusCode).isNotEqualTo(401);
        }

        @Test
        @DisplayName("/api/users/public/register should be publicly accessible")
        void publicRegisterEndpoint_IsPublic() throws Exception {
            int statusCode = mockMvc.perform(post("/api/users/public/register")
                            .contentType("application/json")
                            .content("{}"))
                    .andReturn().getResponse().getStatus();
            org.assertj.core.api.Assertions.assertThat(statusCode).isNotEqualTo(401);
        }

        @Test
        @DisplayName("NFC endpoint should be publicly accessible")
        void nfcEndpoint_IsPublic() throws Exception {
            mockMvc.perform(post("/api/attendance/nfc/9551674a19bae81d4d27f5436470c9ee6ecd0b371088686f6afc58d6bf68df30")
                            .contentType("application/json")
                            .content("{\"dni\": 123456}"))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("Protected Endpoints")
    class ProtectedEndpoints {

        @Test
        @DisplayName("/api/users/getAll should require authentication")
        void usersEndpoint_RequiresAuth() throws Exception {
            mockMvc.perform(get("/api/users/getAll"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("/api/activities/getAll should require authentication")
        void activitiesEndpoint_RequiresAuth() throws Exception {
            mockMvc.perform(get("/api/activities/getAll"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("/api/payments/getAll should require authentication")
        void paymentsEndpoint_RequiresAuth() throws Exception {
            mockMvc.perform(get("/api/payments/getAll"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("/api/attendance/user/1 should require authentication")
        void attendanceEndpoint_RequiresAuth() throws Exception {
            mockMvc.perform(get("/api/attendance/user/1"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
